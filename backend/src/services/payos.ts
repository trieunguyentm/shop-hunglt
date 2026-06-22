import { PayOS } from '@payos/node';
import type { Webhook, WebhookData } from '@payos/node';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

/**
 * Wrapper PayOS (SDK v2). Khởi tạo lazy; nếu chưa cấu hình credentials thì
 * `isConfigured()` = false để tầng order biết và từ chối thanh toán online.
 * Tài liệu: https://payos.vn/docs — SDK: @payos/node v2.
 */

let client: PayOS | null = null;

export function isConfigured(): boolean {
  return env.payos.configured;
}

function getClient(): PayOS {
  if (!env.payos.configured) {
    throw AppError.badRequest('Cổng thanh toán PayOS chưa được cấu hình (thiếu PAYOS_* trong .env)');
  }
  if (!client) {
    client = new PayOS({
      clientId: env.payos.clientId,
      apiKey: env.payos.apiKey,
      checksumKey: env.payos.checksumKey,
    });
  }
  return client;
}

export interface CreateLinkInput {
  orderCode: number; // số nguyên duy nhất
  amount: number; // VND nguyên
  description: string; // tối đa 25 ký tự (ràng buộc PayOS)
  returnUrl: string;
  cancelUrl: string;
  buyerName?: string;
  buyerPhone?: string;
  items?: { name: string; quantity: number; price: number }[];
}

/** Tạo link thanh toán → trả checkoutUrl + qrCode + paymentLinkId. */
export async function createPaymentLink(input: CreateLinkInput) {
  const payos = getClient();
  return payos.paymentRequests.create({
    orderCode: input.orderCode,
    amount: input.amount,
    description: input.description.slice(0, 25),
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    buyerName: input.buyerName,
    buyerPhone: input.buyerPhone,
    items: input.items,
  });
}

/** Lấy thông tin link thanh toán theo orderCode (để đối soát trạng thái). */
export async function getPaymentLink(orderCode: number) {
  const payos = getClient();
  return payos.paymentRequests.get(orderCode);
}

/** Hủy link thanh toán. */
export async function cancelPaymentLink(orderCode: number, reason?: string) {
  const payos = getClient();
  return payos.paymentRequests.cancel(orderCode, reason);
}

/** Xác thực dữ liệu webhook (kiểm tra chữ ký). Ném lỗi nếu không hợp lệ. */
export async function verifyWebhook(body: Webhook): Promise<WebhookData> {
  const payos = getClient();
  return payos.webhooks.verify(body);
}

/** Đăng ký URL webhook với PayOS (gọi 1 lần khi setup). */
export async function confirmWebhook(url: string) {
  const payos = getClient();
  return payos.webhooks.confirm(url);
}
