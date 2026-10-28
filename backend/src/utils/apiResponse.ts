import { Response } from 'express';

/**
 * Chuẩn hóa response trả về cho FE. Mọi endpoint dùng chung định dạng này.
 */
export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  /** Điểm trung bình (danh sách đánh giá). */
  average?: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: ApiMeta,
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  details?: unknown,
): Response {
  return res.status(statusCode).json({
    success: false,
    error: { message, ...(details ? { details } : {}) },
  });
}
