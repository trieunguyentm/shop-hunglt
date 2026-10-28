import type { BadgeTone } from '@/components/ui/Badge';
import type { OrderStatus, ProductStatus } from '@/lib/types';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PACKING: 'Đang đóng gói',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Trả hàng',
};

export const ORDER_STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PACKING: 'info',
  SHIPPING: 'brand',
  DELIVERED: 'success',
  CANCELLED: 'neutral',
  RETURNED: 'danger',
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[];

/** Luồng chuyển trạng thái hợp lệ — khớp backend (order.rules.ts). */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKING', 'CANCELLED'],
  PACKING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

/** Phí vận chuyển hiển thị — backend là nơi quyết định (SHIPPING_FEE). */
export const SHIPPING_FEE = 30000;

/** Các bước của đơn thành công — dùng vẽ thanh tiến trình. */
export const ORDER_STATUS_FLOW: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED'];

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Đã hoàn tiền',
  FAILED: 'Thất bại',
};

export const PAYMENT_STATUS_TONE: Record<string, BadgeTone> = {
  UNPAID: 'warning',
  PAID: 'success',
  REFUNDED: 'info',
  FAILED: 'danger',
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng',
  PAYOS: 'PayOS (QR / chuyển khoản)',
  BANK_TRANSFER: 'Chuyển khoản',
  MOMO: 'MoMo',
  VNPAY: 'VNPay',
};

/** Nhãn ngắn cho danh sách (không gian hẹp). */
export const PAYMENT_METHOD_SHORT: Record<string, string> = {
  COD: 'COD',
  PAYOS: 'PayOS',
  BANK_TRANSFER: 'Chuyển khoản',
  MOMO: 'MoMo',
  VNPAY: 'VNPay',
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  ACTIVE: 'Đang bán',
  HIDDEN: 'Đang ẩn',
  OUT_OF_STOCK: 'Hết hàng',
};

export const PRODUCT_STATUS_TONE: Record<ProductStatus, BadgeTone> = {
  ACTIVE: 'success',
  HIDDEN: 'neutral',
  OUT_OF_STOCK: 'danger',
};

export const CONTACT_STATUS_LABEL: Record<string, string> = {
  NEW: 'Mới',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã xử lý',
};

export const CONTACT_STATUS_TONE: Record<string, BadgeTone> = {
  NEW: 'brand',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  STAFF: 'Nhân viên',
  CUSTOMER: 'Khách hàng',
};

export const ROLE_TONE: Record<string, BadgeTone> = {
  ADMIN: 'dark',
  STAFF: 'info',
  CUSTOMER: 'neutral',
};
