import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as customerService from './customer.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.listCustomers(req.query as never);
  return sendSuccess(res, result.items, 200, result.meta);
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await customerService.getCustomer(req.params.id));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  return sendSuccess(res, await customerService.updateCustomer(req.params.id, req.body));
});
