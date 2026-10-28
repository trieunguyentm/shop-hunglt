import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import { env } from '../../config/env';
import * as payos from '../../services/payos';
import { assertPromotionUsable, computeDiscount } from '../promotion/promotion.service';
import type { CreateOrderInput, ListOrdersQuery } from './order.schema';
import { ORDER_STATUS_LABEL_VI, SHIPPING_FEE, canTransition, shouldRestock } from './order.rules';

const orderInclude = {
  items: true,
  payment: true,
  customer: { select: { id: true, fullName: true, phone: true } },
};

function genOrderCode(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DH-${ymd}-${rand}`;
}

function genPayosCode(): number {
  // 9 chữ số (< 2^31) để vừa kiểu Int của Postgres, duy nhất nhờ ràng buộc @unique
  return Math.floor(100000000 + Math.random() * 899999999);
}

/** Đặt hàng từ giỏ — kiểm tồn, trừ kho, tạo đơn + thanh toán (transaction). */
export async function createOrder(
  customer: { id: string; fullName: string },
  input: CreateOrderInput,
) {
  if (input.paymentMethod === 'PAYOS' && !payos.isConfigured()) {
    throw AppError.badRequest('Thanh toán online (PayOS) chưa được cấu hình. Vui lòng chọn COD.');
  }

  const cart = await prisma.cart.findUnique({
    where: { customerId: customer.id },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) {
    throw AppError.badRequest('Giỏ hàng đang trống');
  }

  const payosCode = input.paymentMethod === 'PAYOS' ? genPayosCode() : null;

  const order = await prisma.$transaction(async (tx) => {
    let subtotal = 0;
    const itemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

    for (const ci of cart.items) {
      const product = ci.product;
      if (product.status === 'HIDDEN') {
        throw AppError.badRequest(`Sản phẩm "${product.name}" không còn bán`);
      }
      const unitPrice = Number(product.salePrice);
      const lineTotal = unitPrice * ci.quantity;
      subtotal += lineTotal;

      // Kiểm tra & trừ tồn theo biến thể (nếu có) + tồn tổng của sản phẩm
      if (ci.size || ci.color) {
        const variant = await tx.productVariant.findFirst({
          where: { productId: product.id, size: ci.size ?? '', color: ci.color ?? '' },
        });
        if (variant) {
          if (variant.stock < ci.quantity) {
            throw AppError.conflict(
              `"${product.name}" (${ci.size}/${ci.color}) không đủ hàng (còn ${variant.stock})`,
            );
          }
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { decrement: ci.quantity } },
          });
        }
      }
      if (product.stock < ci.quantity) {
        throw AppError.conflict(`"${product.name}" không đủ hàng (còn ${product.stock})`);
      }
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: ci.quantity } },
      });

      itemsData.push({
        productId: product.id,
        productName: product.name,
        size: ci.size,
        color: ci.color,
        quantity: ci.quantity,
        unitPrice,
        lineTotal,
      });
    }

    // Áp dụng khuyến mãi (xác thực lại server-side, giảm lượt trong cùng transaction)
    let discount = 0;
    let promotionId: string | null = null;
    if (input.promotionCode) {
      const promo = await tx.promotion.findUnique({ where: { code: input.promotionCode } });
      assertPromotionUsable(promo, subtotal);
      discount = computeDiscount(promo, subtotal);
      promotionId = promo.id;
      await tx.promotion.update({
        where: { id: promo.id },
        data: { quantityLeft: { decrement: 1 } },
      });
    }

    const total = subtotal - discount + SHIPPING_FEE;

    const created = await tx.order.create({
      data: {
        code: genOrderCode(),
        customerId: customer.id,
        promotionId,
        status: OrderStatus.PENDING,
        receiverName: input.receiverName,
        receiverPhone: input.receiverPhone,
        shippingAddress: input.shippingAddress,
        shippingMethod: input.shippingMethod,
        shippingFee: SHIPPING_FEE,
        subtotal,
        discount,
        total,
        note: input.note,
        items: { createMany: { data: itemsData } },
        payment: {
          create: {
            method: input.paymentMethod,
            status: 'UNPAID',
            amount: total,
            payosOrderCode: payosCode,
          },
        },
      },
      include: orderInclude,
    });

    // Xóa giỏ sau khi đặt
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  // Tạo link PayOS (ngoài transaction — gọi API ngoài)
  if (input.paymentMethod === 'PAYOS' && payosCode) {
    const link = await payos.createPaymentLink({
      orderCode: payosCode,
      amount: Number(order.total),
      description: order.code.replace('DH-', ''), // ≤ 25 ký tự
      returnUrl: `${env.frontendUrl}/orders/${order.id}?paid=1`,
      cancelUrl: `${env.frontendUrl}/orders/${order.id}?canceled=1`,
      buyerName: customer.fullName,
      buyerPhone: input.receiverPhone,
    });
    const payment = await prisma.payment.update({
      where: { orderId: order.id },
      data: { checkoutUrl: link.checkoutUrl, transactionId: link.paymentLinkId },
    });
    return { order: { ...order, payment }, checkoutUrl: link.checkoutUrl };
  }

  return { order, checkoutUrl: null };
}

export async function listMyOrders(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    orderBy: { orderedAt: 'desc' },
    include: { items: true, payment: true },
  });
}

export async function getOrderForCustomer(customerId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!order || order.customerId !== customerId) throw AppError.notFound('Không tìm thấy đơn hàng');
  return order;
}

export async function getOrderAdmin(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!order) throw AppError.notFound('Không tìm thấy đơn hàng');
  return order;
}

export async function listOrders(query: ListOrdersQuery) {
  const { page, pageSize, status } = query;
  const where: Prisma.OrderWhereInput = status ? { status } : {};
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { orderedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { payment: true, customer: { select: { fullName: true } }, _count: { select: { items: true } } },
    }),
    prisma.order.count({ where }),
  ]);
  return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

/** Hoàn tồn kho cho 1 đơn (khi hủy). */
async function restock(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const it of items) {
    await tx.product.update({
      where: { id: it.productId },
      data: { stock: { increment: it.quantity } },
    });
    if (it.size || it.color) {
      const variant = await tx.productVariant.findFirst({
        where: { productId: it.productId, size: it.size ?? '', color: it.color ?? '' },
      });
      if (variant) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { increment: it.quantity } },
        });
      }
    }
  }
}

/** Khách hủy đơn (chỉ khi còn PENDING). */
export async function cancelOrder(customerId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.customerId !== customerId) throw AppError.notFound('Không tìm thấy đơn hàng');
  if (order.status !== 'PENDING') {
    throw AppError.badRequest('Chỉ có thể hủy đơn khi đang chờ xác nhận');
  }
  return prisma.$transaction(async (tx) => {
    await restock(tx, orderId);
    return tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: orderInclude,
    });
  });
}

/** Nhân viên cập nhật trạng thái đơn. */
export async function updateStatus(orderId: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw AppError.notFound('Không tìm thấy đơn hàng');

  if (order.status === status) {
    return prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: orderInclude });
  }
  if (!canTransition(order.status, status)) {
    throw AppError.badRequest(
      `Không thể chuyển đơn từ "${ORDER_STATUS_LABEL_VI[order.status]}" sang "${ORDER_STATUS_LABEL_VI[status]}"`,
    );
  }

  return prisma.$transaction(async (tx) => {
    // Hủy / trả hàng → hoàn tồn kho
    if (shouldRestock(status)) {
      await restock(tx, orderId);
    }
    // COD: giao thành công đồng nghĩa đã thu tiền → ghi nhận thanh toán
    if (status === 'DELIVERED') {
      await tx.payment.updateMany({
        where: { orderId, method: 'COD', status: 'UNPAID' },
        data: { status: 'PAID', paidAt: new Date() },
      });
    }
    return tx.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
      },
      include: orderInclude,
    });
  });
}

/** Đánh dấu đã thanh toán theo payosOrderCode (gọi từ webhook hoặc đối soát). */
export async function markPaidByPayosCode(payosOrderCode: number, reference?: string) {
  const payment = await prisma.payment.findUnique({ where: { payosOrderCode } });
  if (!payment) return null;
  if (payment.status === 'PAID') return payment;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'PAID', paidAt: new Date(), ...(reference ? { transactionId: reference } : {}) },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'CONFIRMED' },
    }),
  ]);
  return prisma.payment.findUnique({ where: { id: payment.id } });
}

/** Đối soát trạng thái đơn PayOS (dùng cho trang return — không cần webhook). */
export async function reconcilePayos(orderId: string, customerId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order || order.customerId !== customerId) throw AppError.notFound('Không tìm thấy đơn hàng');
  if (!order.payment?.payosOrderCode) return order;
  if (order.payment.status === 'PAID') return getOrderForCustomer(customerId, orderId);

  if (payos.isConfigured()) {
    try {
      const info = await payos.getPaymentLink(order.payment.payosOrderCode);
      if (info.status === 'PAID') {
        await markPaidByPayosCode(order.payment.payosOrderCode, info.transactions?.[0]?.reference);
      }
    } catch {
      // bỏ qua lỗi đối soát
    }
  }
  return getOrderForCustomer(customerId, orderId);
}
