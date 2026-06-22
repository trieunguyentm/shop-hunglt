import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as authService from './auth.service';

// UC13 — Đăng ký qua Keycloak Admin API
export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  return sendSuccess(res, result, 201);
});

// Thông tin người dùng hiện tại — đồng bộ DB từ token rồi trả hồ sơ
export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const profile = await authService.syncFromToken(req.user);
  return sendSuccess(res, profile);
});
