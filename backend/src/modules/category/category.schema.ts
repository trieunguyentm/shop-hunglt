import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên danh mục bắt buộc').max(100),
    description: z.string().max(500).optional(),
    parentId: z.string().optional().nullable(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    parentId: z.string().optional().nullable(),
  }),
});

export const categoryIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
