import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { uniqueSlug } from '../../utils/slugify';
import type {
  AdminListQuery,
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from './product.schema';

// ===== Public =====

/** Danh sách sản phẩm (chỉ ACTIVE) có phân trang, tìm kiếm, lọc danh mục, sắp xếp. */
export async function listProducts(query: ListProductsQuery) {
  const { page, pageSize, search, category, sort } = query;

  const where: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    ...(category ? { category: { slug: category } } : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === 'price_asc'
      ? { salePrice: 'asc' }
      : sort === 'price_desc'
        ? { salePrice: 'desc' }
        : { createdAt: 'desc' };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

/** Chi tiết sản phẩm theo slug. */
export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: [{ size: 'asc' }, { color: 'asc' }] },
      category: { select: { name: true, slug: true } },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { customer: { select: { fullName: true } } },
      },
    },
  });
  if (!product || product.status === 'HIDDEN') {
    throw AppError.notFound('Không tìm thấy sản phẩm');
  }
  return product;
}

// ===== Admin =====

function totalStock(variants: { stock: number }[] | undefined, fallback?: number): number {
  if (variants && variants.length > 0) {
    return variants.reduce((sum, v) => sum + v.stock, 0);
  }
  return fallback ?? 0;
}

/** Tạo sản phẩm (kèm ảnh + biến thể) trong transaction. */
export async function createProduct(input: CreateProductInput) {
  const slug = await uniqueSlug(input.name, async (s) => {
    const p = await prisma.product.findUnique({ where: { slug: s } });
    return p !== null;
  });
  const sku = input.sku?.trim() || `SP-${Date.now().toString(36).toUpperCase()}`;

  return prisma.product.create({
    data: {
      sku,
      name: input.name,
      slug,
      description: input.description,
      salePrice: input.salePrice,
      costPrice: input.costPrice,
      stock: totalStock(input.variants, input.stock),
      material: input.material,
      status: input.status,
      categoryId: input.categoryId,
      supplierId: input.supplierId || null,
      images: { create: input.images },
      variants: { create: input.variants },
    },
    include: { images: true, variants: true },
  });
}

/** Cập nhật sản phẩm; nếu gửi images/variants thì thay thế toàn bộ. */
export async function updateProduct(id: string, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound('Không tìm thấy sản phẩm');

  return prisma.$transaction(async (tx) => {
    if (input.images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (input.images.length) {
        await tx.productImage.createMany({
          data: input.images.map((img) => ({ ...img, productId: id })),
        });
      }
    }
    if (input.variants) {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      if (input.variants.length) {
        await tx.productVariant.createMany({
          data: input.variants.map((v) => ({ ...v, productId: id })),
        });
      }
    }

    return tx.product.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        salePrice: input.salePrice,
        costPrice: input.costPrice,
        material: input.material,
        status: input.status,
        categoryId: input.categoryId,
        supplierId: input.supplierId === undefined ? undefined : input.supplierId || null,
        ...(input.variants
          ? { stock: totalStock(input.variants, input.stock) }
          : input.stock !== undefined
            ? { stock: input.stock }
            : {}),
      },
      include: { images: true, variants: true },
    });
  });
}

export async function deleteProduct(id: string) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!existing) throw AppError.notFound('Không tìm thấy sản phẩm');
  if (existing._count.orderItems > 0) {
    // Đã phát sinh đơn hàng — ẩn thay vì xóa để giữ toàn vẹn dữ liệu
    await prisma.product.update({ where: { id }, data: { status: 'HIDDEN' } });
    return { id, hidden: true };
  }
  await prisma.product.delete({ where: { id } });
  return { id, deleted: true };
}

/** Danh sách sản phẩm cho trang quản trị (mọi trạng thái). */
export async function adminListProducts(query: AdminListQuery) {
  const { page, pageSize, search, status } = query;
  const where: Prisma.ProductWhereInput = {
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    ...(status ? { status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: { select: { name: true } },
        _count: { select: { variants: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);
  return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function getProductByIdAdmin(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: [{ size: 'asc' }, { color: 'asc' }] },
      category: true,
      supplier: true,
    },
  });
  if (!product) throw AppError.notFound('Không tìm thấy sản phẩm');
  return product;
}
