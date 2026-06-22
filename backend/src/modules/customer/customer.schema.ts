import { z } from 'zod';

export const listCustomersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
  }),
});

export const customerIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const updateCustomerSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    tier: z.enum(['REGULAR', 'VIP']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).optional(), // trạng thái tài khoản
  }),
});

export type ListCustomersQuery = z.infer<typeof listCustomersSchema>['query'];
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>['body'];
