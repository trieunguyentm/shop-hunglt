import { z } from 'zod';

export const createPromotionSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên khuyến mãi bắt buộc').max(200),
    code: z.string().min(2, 'Mã tối thiểu 2 ký tự').max(50),
    discountType: z.enum(['PERCENT', 'FIXED']),
    discountValue: z.number().positive('Giá trị giảm phải > 0'),
    minOrderTotal: z.number().min(0).default(0),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    quantityLeft: z.number().int().min(0).default(0),
    isActive: z.boolean().default(true),
  }),
});

export const updatePromotionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: createPromotionSchema.shape.body.partial(),
});

export const promotionIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const applyPromotionSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Nhập mã khuyến mãi'),
    subtotal: z.number().min(0),
  }),
});

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>['body'];
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>['body'];
