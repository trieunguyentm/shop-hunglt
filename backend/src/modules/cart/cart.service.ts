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

/** Lấy giỏ hàng kèm chi tiết + tổng tiền tạm tính. */
export async function getCart(customerId: string) {
  const cart = await getOrCreateCart(customerId);
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: itemInclude,
    orderBy: { addedAt: 'asc' },
  });
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
  await assertItemOwned(customerId, itemId);
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return getCart(customerId);
}

export async function removeItem(customerId: string, itemId: string) {
  await assertItemOwned(customerId, itemId);
  await prisma.cartItem.delete({ where: { id: itemId } });
  return getCart(customerId);
}
