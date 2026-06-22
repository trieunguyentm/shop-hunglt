import { z } from 'zod';

// ===== Public =====
export const listProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(12),
    search: z.string().trim().optional(),
    category: z.string().trim().optional(), // slug danh mục
    sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  }),
});

export const productSlugSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

// ===== Admin =====
const imageSchema = z.object({
  url: z.string().url('URL ảnh không hợp lệ'),
  alt: z.string().optional(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  stock: z.number().int().min(0).default(0),
  priceDelta: z.number().default(0),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên sản phẩm bắt buộc').max(200),
    sku: z.string().max(50).optional(),
    description: z.string().max(2000).optional(),
    salePrice: z.number().min(0, 'Giá bán không hợp lệ'),
    costPrice: z.number().min(0, 'Giá nhập không hợp lệ'),
    stock: z.number().int().min(0).optional(),
    material: z.string().max(100).optional(),
    status: z.enum(['ACTIVE', 'HIDDEN', 'OUT_OF_STOCK']).default('ACTIVE'),
    categoryId: z.string().min(1, 'Chọn danh mục'),
    supplierId: z.string().optional().nullable(),
    images: z.array(imageSchema).default([]),
    variants: z.array(variantSchema).default([]),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: createProductSchema.shape.body.partial(),
});

export const adminListProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
    status: z.enum(['ACTIVE', 'HIDDEN', 'OUT_OF_STOCK']).optional(),
  }),
});

export const productIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export type ListProductsQuery = z.infer<typeof listProductsSchema>['query'];
export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type AdminListQuery = z.infer<typeof adminListProductsSchema>['query'];
