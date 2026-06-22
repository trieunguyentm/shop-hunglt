import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    rating: z.number().int().min(1, 'Tối thiểu 1 sao').max(5, 'Tối đa 5 sao'),
    content: z.string().max(2000).optional(),
  }),
});

export const listReviewsSchema = z.object({
  query: z.object({
    productId: z.string().min(1),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

export const eligibilitySchema = z.object({
  query: z.object({ productId: z.string().min(1) }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];
