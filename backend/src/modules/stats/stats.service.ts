import { OrderStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

// Đơn được tính doanh thu: đã xác nhận trở lên (loại PENDING/CANCELLED/RETURNED)
const REVENUE_STATUSES: OrderStatus[] = ['CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED'];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** UC9 — Số liệu tổng quan cho dashboard quản trị. */
export async function overview() {
  const today = startOfToday();
  const month = startOfMonth();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const revenueWhere = { status: { in: REVENUE_STATUSES } };

  const [
    revenueTodayAgg,
    revenueMonthAgg,
    revenueTotalAgg,
    totalOrders,
    totalCustomers,
    totalProducts,
    newCustomers,
    ordersByStatusRaw,
    recentOrders,
    topProductsRaw,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { ...revenueWhere, orderedAt: { gte: today } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { ...revenueWhere, orderedAt: { gte: month } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: revenueWhere, _sum: { total: true } }),
    prisma.order.count(),
    prisma.customer.count(),
    prisma.product.count({ where: { status: 'ACTIVE' } }),
    prisma.customer.count({ where: { createdAt: { gte: month } } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.findMany({
      where: { ...revenueWhere, orderedAt: { gte: sevenDaysAgo } },
      select: { total: true, orderedAt: true },
    }),
    prisma.orderItem.groupBy({
      by: ['productName'],
      where: { order: revenueWhere },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  // Doanh thu 7 ngày gần nhất
  const days: { date: string; revenue: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    days.push({ date: key, revenue: 0 });
  }
  for (const o of recentOrders) {
    const d = new Date(o.orderedAt);
    const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const slot = days.find((x) => x.date === key);
    if (slot) slot.revenue += Number(o.total);
  }

  return {
    revenueToday: Number(revenueTodayAgg._sum.total ?? 0),
    revenueMonth: Number(revenueMonthAgg._sum.total ?? 0),
    revenueTotal: Number(revenueTotalAgg._sum.total ?? 0),
    totalOrders,
    totalCustomers,
    totalProducts,
    newCustomers,
    ordersByStatus: ordersByStatusRaw.map((r) => ({ status: r.status, count: r._count._all })),
    revenueByDay: days,
    topProducts: topProductsRaw.map((p) => ({
      name: p.productName,
      quantity: p._sum.quantity ?? 0,
      revenue: Number(p._sum.lineTotal ?? 0),
    })),
  };
}
