import type { OrderStatus } from '@prisma/client';

/** Phí vận chuyển cố định — do server quyết định, không tin giá trị client gửi lên. */
export const SHIPPING_FEE = 30000;

/**
 * Luồng chuyển trạng thái đơn hợp lệ. CANCELLED/RETURNED là trạng thái kết thúc.
 * Chặn các bước lùi (vd CANCELLED → PENDING) vốn làm lệch tồn kho đã hoàn.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKING', 'CANCELLED'],
  PACKING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

export const ORDER_STATUS_LABEL_VI: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PACKING: 'Đang đóng gói',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Trả hàng',
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Trạng thái đưa hàng về kho (hủy trước khi giao, khách trả hàng). */
export function shouldRestock(to: OrderStatus): boolean {
  return to === 'CANCELLED' || to === 'RETURNED';
}
