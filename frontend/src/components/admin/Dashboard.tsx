'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getStatsOverview } from '@/lib/api';
import { formatVND } from '@/lib/utils';
import { ORDER_STATUS_LABEL } from '@/lib/orderStatus';
import type { StatsOverview } from '@/lib/types';

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl2 border border-line bg-bone p-6">
      <p className="eyebrow mb-2">{label}</p>
      <p className="font-display text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-mist">{hint}</p>}
    </div>
  );
}

export function Dashboard() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    getStatsOverview(token)
      .then((r) => setStats(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi tải thống kê'));
  }, [token]);

  if (error) return <p className="text-sm text-clay-dark">{error}</p>;
  if (!stats) return <p className="text-mist">Đang tải số liệu...</p>;

  const statusData = stats.ordersByStatus.map((s) => ({
    name: ORDER_STATUS_LABEL[s.status],
    count: s.count,
  }));

  return (
    <div className="space-y-8">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Doanh thu hôm nay" value={formatVND(stats.revenueToday)} />
        <Kpi label="Doanh thu tháng" value={formatVND(stats.revenueMonth)} />
        <Kpi label="Tổng đơn hàng" value={String(stats.totalOrders)} />
        <Kpi label="Khách hàng" value={String(stats.totalCustomers)} hint={`+${stats.newCustomers} tháng này`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Doanh thu 7 ngày */}
        <div className="rounded-xl2 border border-line p-6">
          <h2 className="mb-4 font-display text-lg">Doanh thu 7 ngày</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.revenueByDay} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2DBD0" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8C857A' }} />
              <YAxis tick={{ fontSize: 11, fill: '#8C857A' }} width={70} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatVND(Number(v))} />
              <Line type="monotone" dataKey="revenue" stroke="#B25C3C" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Đơn theo trạng thái */}
        <div className="rounded-xl2 border border-line p-6">
          <h2 className="mb-4 font-display text-lg">Đơn theo trạng thái</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusData} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2DBD0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8C857A' }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8C857A' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1A1714" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top sản phẩm */}
      <div className="rounded-xl2 border border-line p-6">
        <h2 className="mb-4 font-display text-lg">Sản phẩm bán chạy</h2>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-mist">Chưa có dữ liệu bán hàng.</p>
        ) : (
          <ul className="divide-y divide-line">
            {stats.topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center justify-between py-3">
                <span className="flex items-center gap-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-bone text-xs">{i + 1}</span>
                  {p.name}
                </span>
                <span className="text-sm text-graphite">{p.quantity} đã bán · {formatVND(p.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
