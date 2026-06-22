import { z } from 'zod';

export const createContactSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Nhập họ tên').max(100),
    email: z.string().email('Email không hợp lệ'),
    phone: z.string().max(15).optional(),
    subject: z.string().min(2, 'Nhập tiêu đề').max(200),
    content: z.string().min(5, 'Nội dung quá ngắn').max(2000),
  }),
});

export const listContactSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED']).optional(),
  }),
});

export const updateContactSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED']) }),
});

export type CreateContactInput = z.infer<typeof createContactSchema>['body'];
export type ListContactQuery = z.infer<typeof listContactSchema>['query'];
