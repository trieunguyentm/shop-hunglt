import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    receiverName: z.string().min(2, 'Nhập tên người nhận'),
    receiverPhone: z.string().min(8, 'Số điện thoại không hợp lệ'),
    shippingAddress: z.string().min(5, 'Nhập địa chỉ giao hàng'),
    shippingMethod: z.string().optional(),
    shippingFee: z.number().min(0).default(0),
    paymentMethod: z.enum(['COD', 'PAYOS']).default('COD'),
    promotionCode: z.string().optional(),
    note: z.string().max(500).optional(),
  }),
});

export const listOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: z
      .enum(['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURNED'])
      .optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: z.enum([
      'PENDING',
      'CONFIRMED',
      'PACKING',
      'SHIPPING',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
    ]),
  }),
});

export const orderIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type ListOrdersQuery = z.infer<typeof listOrdersSchema>['query'];
