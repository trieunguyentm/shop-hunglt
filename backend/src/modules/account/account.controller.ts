import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as accountService from './account.service';

/** Chặn ADMIN tự khóa / xóa / đổi quyền chính mình (tránh mất quyền quản trị). */
function assertNotSelf(req: Request) {
  if (req.user?.keycloakId && req.user.keycloakId === req.params.id) {
    throw AppError.badRequest('Không thể thay đổi quyền, khóa hoặc xóa chính tài khoản của bạn');
  }
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await accountService.listAccounts(req.query as never);
  return sendSuccess(res, result.items, 200, result.meta);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await accountService.createAccount(req.body);
  return sendSuccess(res, result, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  assertNotSelf(req);
  const result = await accountService.updateAccount(req.params.id, req.body);
  return sendSuccess(res, result);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  assertNotSelf(req);
  const result = await accountService.deleteAccount(req.params.id);
  return sendSuccess(res, result);
});
