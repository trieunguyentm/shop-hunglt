import { z } from 'zod';

export const addItemSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    size: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    quantity: z.number().int().min(1).default(1),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ quantity: z.number().int().min(1) }),
});

export const cartItemIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export type AddItemInput = z.infer<typeof addItemSchema>['body'];
