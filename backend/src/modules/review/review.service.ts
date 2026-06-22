import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type { CreateReviewInput } from './review.schema';

/** Tìm đơn DELIVERED của khách có chứa sản phẩm này. */
async function findDeliveredOrder(customerId: string, productId: string) {
  const item = await prisma.orderItem.findFirst({
    where: { productId, order: { customerId, status: 'DELIVERED' } },
    select: { orderId: true },
  });
  return item?.orderId ?? null;
}

/** Kiểm tra khách có được đánh giá sản phẩm không. */
export async function checkEligibility(customerId: string, productId: string) {
  const existing = await prisma.review.findFirst({ where: { customerId, productId } });
  if (existing) return { canReview: false, reason: 'Bạn đã đánh giá sản phẩm này' };
  const orderId = await findDeliveredOrder(customerId, productId);
  if (!orderId) {
    return { canReview: false, reason: 'Chỉ đánh giá sau khi đã nhận hàng' };
  }
  return { canReview: true, reason: null };
}

/** Tạo đánh giá — chỉ khi đã mua & nhận hàng, chưa từng đánh giá. */
export async function createReview(customerId: string, input: CreateReviewInput) {
  const existing = await prisma.review.findFirst({
    where: { customerId, productId: input.productId },
  });
  if (existing) throw AppError.conflict('Bạn đã đánh giá sản phẩm này');

  const orderId = await findDeliveredOrder(customerId, input.productId);
  if (!orderId) {
    throw AppError.forbidden('Chỉ có thể đánh giá sản phẩm bạn đã mua và nhận hàng');
  }

  return prisma.review.create({
    data: {
      productId: input.productId,
      customerId,
      orderId,
      rating: input.rating,
      content: input.content,
    },
    include: { customer: { select: { fullName: true } } },
  });
}

/** Danh sách đánh giá của 1 sản phẩm + thống kê trung bình. */
export async function listReviews(productId: string, page: number, pageSize: number) {
  const [items, total, stats] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { customer: { select: { fullName: true } } },
    }),
    prisma.review.count({ where: { productId } }),
    prisma.review.aggregate({ where: { productId }, _avg: { rating: true } }),
  ]);
  return {
    items,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    average: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
  };
}
