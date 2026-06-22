import { z } from 'zod';

const realmRole = z.enum(['ADMIN', 'STAFF', 'CUSTOMER']);

export const listAccountsSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const createAccountSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
    roles: z.array(realmRole).min(1, 'Chọn ít nhất 1 vai trò').default(['STAFF']),
  }),
});

export const accountIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const updateAccountSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    roles: z.array(realmRole).optional(),
    enabled: z.boolean().optional(),
  }),
});

export type ListAccountsQuery = z.infer<typeof listAccountsSchema>['query'];
export type CreateAccountInput = z.infer<typeof createAccountSchema>['body'];
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>['body'];
