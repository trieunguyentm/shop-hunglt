import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import * as accountService from './account.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await accountService.listAccounts(req.query as never);
  return sendSuccess(res, result.items, 200, result.meta);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await accountService.createAccount(req.body);
  return sendSuccess(res, result, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await accountService.updateAccount(req.params.id, req.body);
  return sendSuccess(res, result);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await accountService.deleteAccount(req.params.id);
  return sendSuccess(res, result);
});
