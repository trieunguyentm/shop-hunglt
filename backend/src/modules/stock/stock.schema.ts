import { z } from 'zod';

export const createReceiptSchema = z.object({
  body: z.object({
    supplierId: z.string().min(1, 'Chọn nhà cung cấp'),
    note: z.string().max(500).optional(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          size: z.string().optional().nullable(),
          color: z.string().optional().nullable(),
          quantity: z.number().int().min(1, 'Số lượng tối thiểu 1'),
          costPrice: z.number().min(0, 'Đơn giá nhập không hợp lệ'),
        }),
      )
      .min(1, 'Phiếu nhập phải có ít nhất 1 dòng'),
  }),
});

export const listReceiptsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    supplierId: z.string().optional(),
  }),
});

export const receiptIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>['body'];
export type ListReceiptsQuery = z.infer<typeof listReceiptsSchema>['query'];
