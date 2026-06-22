import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../utils/AppError';
import type { ListCustomersQuery, UpdateCustomerInput } from './customer.schema';

/** UC6 — Danh sách khách hàng (tìm theo tên/SĐT/email). */
export async function listCustomers(query: ListCustomersQuery) {
  const { page, pageSize, search } = query;
  const where: Prisma.CustomerWhereInput = search
    ? {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { account: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        account: { select: { email: true, status: true } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return { items: rows, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

/** UC6 — Chi tiết khách hàng kèm lịch sử đơn + tổng chi tiêu. */
export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      account: { select: { email: true, username: true, status: true } },
      orders: {
        orderBy: { orderedAt: 'desc' },
        take: 20,
        include: { payment: { select: { status: true, method: true } } },
      },
    },
  });
  if (!customer) throw AppError.notFound('Không tìm thấy khách hàng');

  // Tổng chi tiêu (đơn không bị hủy)
  const spent = await prisma.order.aggregate({
    where: { customerId: id, status: { notIn: ['CANCELLED', 'RETURNED'] } },
    _sum: { total: true },
  });

  return { ...customer, totalSpent: Number(spent._sum.total ?? 0) };
}

/** UC6 — Cập nhật hạng khách / trạng thái tài khoản. */
export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw AppError.notFound('Không tìm thấy khách hàng');

  if (input.tier) {
    await prisma.customer.update({ where: { id }, data: { tier: input.tier } });
  }
  if (input.status) {
    await prisma.account.update({ where: { id: customer.accountId }, data: { status: input.status } });
  }
  return getCustomer(id);
}
