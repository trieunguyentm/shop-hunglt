import { z } from 'zod';

export const listSuppliersSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
  }),
});

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên nhà cung cấp bắt buộc').max(200),
    address: z.string().max(500).optional(),
    phone: z.string().max(15).optional(),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    taxCode: z.string().max(20).optional(),
    contactPerson: z.string().max(100).optional(),
  }),
});

export const updateSupplierSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: createSupplierSchema.shape.body.partial(),
});

export const supplierIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>['body'];
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>['body'];
