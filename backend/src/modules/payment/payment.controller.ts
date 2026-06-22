import { Request, Response } from 'express';
import type { Webhook } from '@payos/node';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../utils/AppError';
import * as payos from '../../services/payos';
import * as orderService from '../order/order.service';

/**
 * Webhook PayOS (public) — PayOS gọi POST về đây khi thanh toán thành công.
 * Luôn trả 200 để PayOS không retry vô ích; xác thực chữ ký trước khi cập nhật.
 */
export const payosWebhook = asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = await payos.verifyWebhook(req.body as Webhook);
    // data.code === '00' là giao dịch thành công
    if (data && data.code === '00') {
      await orderService.markPaidByPayosCode(data.orderCode, data.reference);
    }
  } catch {
    // Chữ ký không hợp lệ / request test → vẫn trả 200
  }
  return res.status(200).json({ success: true });
});

/** Đăng ký URL webhook với PayOS (ADMIN, gọi 1 lần khi setup). */
export const confirmWebhook = asyncHandler(async (req: Request, res: Response) => {
  const url = (req.body?.webhookUrl as string) || '';
  if (!url) throw AppError.badRequest('Thiếu webhookUrl');
  const result = await payos.confirmWebhook(url);
  return sendSuccess(res, result);
});

/** Trạng thái cấu hình cổng thanh toán (cho FE biết có bật PayOS không). */
export const status = asyncHandler(async (_req: Request, res: Response) => {
  return sendSuccess(res, { payos: payos.isConfigured() });
});
