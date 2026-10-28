import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type { AddItemInput } from './cart.schema';

const itemInclude = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      salePrice: true,
      status: true,
      images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
    },
  },
};

async function getOrCreateCart(customerId: string) {
  const cart = await prisma.cart.findUnique({ where: { customerId } });
  if (cart) return cart;
  return prisma.cart.create({ data: { customerId } });
}

/**
 * Tồn kho khả dụng của 1 lựa chọn: theo biến thể (size+màu) nếu sản phẩm có biến thể,
 * ngược lại theo tồn tổng của sản phẩm.
 */
async function availableStock(productId: string, size?: string | null, color?: string | null) {
  const variants = await prisma.productVariant.findMany({ where: { productId } });
  if (variants.length === 0) {
    const p = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } });
    return p?.stock ?? 0;
  }
  const v = variants.find((x) => x.size === (size ?? '') && x.color === (color ?? ''));
  return v?.stock ?? 0;
}

function assertEnough(quantity: number, available: number) {
  if (available <= 0) throw AppError.badRequest('Phân loại này đã hết hàng');
  if (quantity > available) {
    throw AppError.badRequest(`Chỉ còn ${available} sản phẩm cho phân loại này`);
  }
}

/** Lấy giỏ hàng kèm chi tiết + tổng tiền tạm tính + tồn khả dụng từng dòng. */
export async function getCart(customerId: string) {
  const cart = await getOrCreateCart(customerId);
  const rows = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: itemInclude,
    orderBy: { addedAt: 'asc' },
  });
  const items = await Promise.all(
    rows.map(async (it) => ({ ...it, available: await availableStock(it.productId, it.size, it.color) })),
  );
  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.product.salePrice) * it.quantity,
    0,
  );
  return { id: cart.id, items, subtotal, count: items.reduce((s, i) => s + i.quantity, 0) };
}

/** Thêm sản phẩm vào giỏ (gộp nếu cùng product+size+color). */
export async function addItem(customerId: string, input: AddItemInput) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product || product.status === 'HIDDEN') {
    throw AppError.notFound('Sản phẩm không tồn tại');
  }
  const cart = await getOrCreateCart(customerId);

  // Không cho thêm vượt tồn (tính cả số lượng đã có trong giỏ)
  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_productId_size_color: {
        cartId: cart.id,
        productId: input.productId,
        size: input.size ?? '',
        color: input.color ?? '',
      },
    },
  });
  assertEnough(
    (existing?.quantity ?? 0) + input.quantity,
    await availableStock(input.productId, input.size, input.color),
  );

  await prisma.cartItem.upsert({
    where: {
      cartId_productId_size_color: {
        cartId: cart.id,
        productId: input.productId,
        size: input.size ?? '',
        color: input.color ?? '',
      },
    },
    update: { quantity: { increment: input.quantity } },
    create: {
      cartId: cart.id,
      productId: input.productId,
      size: input.size ?? '',
      color: input.color ?? '',
      quantity: input.quantity,
    },
  });

  return getCart(customerId);
}

async function assertItemOwned(customerId: string, itemId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });
  if (!item || item.cart.customerId !== customerId) {
    throw AppError.notFound('Không tìm thấy mục trong giỏ');
  }
  return item;
}

export async function updateItem(customerId: string, itemId: string, quantity: number) {
  const item = await assertItemOwned(customerId, itemId);
  assertEnough(quantity, await availableStock(item.productId, item.size, item.color));
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return getCart(customerId);
}

export async function removeItem(customerId: string, itemId: string) {
  await assertItemOwned(customerId, itemId);
  await prisma.cartItem.delete({ where: { id: itemId } });
  return getCart(customerId);
}
