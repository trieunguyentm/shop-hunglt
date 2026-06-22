import { Promotion } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type { CreatePromotionInput, UpdatePromotionInput } from './promotion.schema';

/** Tính số tiền giảm (làm tròn về số nguyên VND). */
export function computeDiscount(promo: Promotion, subtotal: number): number {
  const value = Number(promo.discountValue);
  if (promo.discountType === 'PERCENT') {
    return Math.round((subtotal * value) / 100);
  }
  return Math.min(Math.round(value), subtotal); // FIXED không vượt quá tạm tính
}

/** Kiểm tra mã có dùng được không (ném AppError nếu không) — hàm thuần, không truy DB. */
export function assertPromotionUsable(promo: Promotion | null, subtotal: number, now = new Date()): asserts promo is Promotion {
  if (!promo) throw AppError.notFound('Mã khuyến mãi không tồn tại');
  if (!promo.isActive) throw AppError.badRequest('Mã khuyến mãi đã ngừng áp dụng');
  if (now < promo.startDate) throw AppError.badRequest('Mã khuyến mãi chưa bắt đầu');
  if (now > promo.endDate) throw AppError.badRequest('Mã khuyến mãi đã hết hạn');
  if (promo.quantityLeft <= 0) throw AppError.badRequest('Mã khuyến mãi đã hết lượt sử dụng');
  if (subtotal < Number(promo.minOrderTotal)) {
    throw AppError.badRequest(
      `Đơn tối thiểu ${Number(promo.minOrderTotal).toLocaleString('vi-VN')}đ để dùng mã này`,
    );
  }
}

/** Áp dụng thử mã (cho FE hiển thị giảm giá ở trang thanh toán). */
export async function applyPromotion(code: string, subtotal: number) {
  const promo = await prisma.promotion.findUnique({ where: { code } });
  assertPromotionUsable(promo, subtotal);
  const discount = computeDiscount(promo, subtotal);
  return {
    promotionId: promo.id,
    code: promo.code,
    name: promo.name,
    discount,
    finalTotal: subtotal - discount,
  };
}

// ===== Admin CRUD =====
export async function listPromotions() {
  return prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createPromotion(input: CreatePromotionInput) {
  const existed = await prisma.promotion.findUnique({ where: { code: input.code } });
  if (existed) throw AppError.conflict('Mã khuyến mãi đã tồn tại');
  return prisma.promotion.create({ data: input });
}

export async function updatePromotion(id: string, input: UpdatePromotionInput) {
  const promo = await prisma.promotion.findUnique({ where: { id } });
  if (!promo) throw AppError.notFound('Không tìm thấy khuyến mãi');
  return prisma.promotion.update({ where: { id }, data: input });
}

export async function deletePromotion(id: string) {
  const promo = await prisma.promotion.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  });
  if (!promo) throw AppError.notFound('Không tìm thấy khuyến mãi');
  if (promo._count.orders > 0) {
    // Đã dùng trong đơn → vô hiệu hóa thay vì xóa
    await prisma.promotion.update({ where: { id }, data: { isActive: false } });
    return { id, deactivated: true };
  }
  await prisma.promotion.delete({ where: { id } });
  return { id, deleted: true };
}
