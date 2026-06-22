import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as promotionService from './promotion.service';

export const apply = asyncHandler(async (req: Request, res: Response) => {
  const data = await promotionService.applyPromotion(req.body.code, req.body.subtotal);
  return sendSuccess(res, data);
});

export const list = asyncHandler(async (_req: Request, res: Response) => {
  return sendSuccess(res, await promotionService.listPromotions());
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await promotionService.createPromotion(req.body), 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await promotionService.updatePromotion(req.params.id, req.body));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await promotionService.deletePromotion(req.params.id));
});
