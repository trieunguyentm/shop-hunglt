import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';

// 404 cho route không tồn tại
export function notFoundHandler(req: Request, res: Response) {
  return sendError(res, 404, `Không tìm thấy đường dẫn: ${req.method} ${req.originalUrl}`);
}

// Error handler tập trung — đặt cuối cùng trong chuỗi middleware
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.details);
  }

  if (err instanceof ZodError) {
    return sendError(res, 400, 'Dữ liệu không hợp lệ', err.flatten());
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return sendError(res, 409, 'Dữ liệu đã tồn tại (trùng giá trị duy nhất)', err.meta);
    }
    if (err.code === 'P2025') {
      return sendError(res, 404, 'Không tìm thấy bản ghi');
    }
    return sendError(res, 400, 'Lỗi truy vấn cơ sở dữ liệu', { code: err.code });
  }

  // Lỗi không lường trước
  // eslint-disable-next-line no-console
  console.error('[UnhandledError]', err);
  return sendError(
    res,
    500,
    'Lỗi máy chủ nội bộ',
    env.isProd ? undefined : (err as Error)?.message,
  );
}
