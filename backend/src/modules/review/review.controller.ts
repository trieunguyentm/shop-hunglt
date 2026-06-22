import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import { ensureCustomer } from '../auth/auth.service';
import * as reviewService from './review.service';

async function customerId(req: Request): Promise<string> {
  if (!req.user) throw AppError.unauthorized();
  return (await ensureCustomer(req.user)).id;
}

// Public — danh sách đánh giá của sản phẩm
export const list = asyncHandler(async (req: Request, res: Response) => {
  const { productId, page, pageSize } = req.query as unknown as {
    productId: string;
    page: number;
    pageSize: number;
  };
  const result = await reviewService.listReviews(productId, page, pageSize);
  return sendSuccess(res, result.items, 200, result.meta);
});

// Public-ish: trả average riêng (dùng kèm list)
export const eligibility = asyncHandler(async (req: Request, res: Response) => {
  const cid = await customerId(req);
  const data = await reviewService.checkEligibility(cid, req.query.productId as string);
  return sendSuccess(res, data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const cid = await customerId(req);
  const review = await reviewService.createReview(cid, req.body);
  return sendSuccess(res, review, 201);
});
