import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import { ensureAccount } from '../auth/auth.service';
import * as stockService from './stock.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const account = await ensureAccount(req.user);
  const receipt = await stockService.createReceipt(account.id, req.body);
  return sendSuccess(res, receipt, 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await stockService.listReceipts(req.query as never);
  return sendSuccess(res, result.items, 200, result.meta);
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await stockService.getReceipt(req.params.id));
});
