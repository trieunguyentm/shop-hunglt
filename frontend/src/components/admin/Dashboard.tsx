'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { type LucideIcon, ArrowUpRight, Boxes, CalendarDays, Package, RefreshCw, ShoppingCart, TrendingUp, Users, Wallet } from 'lucide-react';
import { getStatsOverview } from '@/lib/api';
import { useAccessToken } from '@/hooks/useAccessToken';
import { errorMessage, formatVND } from '@/lib/utils';
import { ORDER_STATUS_LABEL } from '@/lib/orderStatus';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, PageHeader } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/Skeleton';
import type { StatsOverview } from '@/lib/types';

// Màu biểu đồ — bám token trong tailwind.config.ts (recharts cần giá trị hex)
const C = { ink: '#111113', brand: '#FF4D2E', lime: '#D7FF3D', line: '#E7E7E2', muted: '#6B6B73' };

const compactVND = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(v % 1_000_000 ? 1 : 0)}tr` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v);

function Kpi({ label, value, hint, icon: Icon, accent }: { label: string; value: string; hint?: string; icon: LucideIcon; accent?: boolean }) {
  return (
    <div className={accent ? 'rounded-3xl bg-ink p-5 text-white' : 'rounded-3xl border border-line bg-surface p-5'}>
      <div className="flex items-center justify-between">
        <p className={accent ? 'text-sm font-medium text-white/70' : 'text-sm font-medium text-ink-3'}>{label}</p>
        <span className={accent ? 'grid h-9 w-9 place-items-center rounded-xl bg-lime-400 text-ink' : 'grid h-9 w-9 place-items-center rounded-xl bg-muted text-ink'}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 truncate text-2xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className={accent ? 'mt-1 text-xs text-white/60' : 'mt-1 text-xs text-ink-3'}>{hint}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label, money }: { active?: boolean; payload?: { value: number }[]; label?: string; money?: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-ink px-3 py-2 text-xs text-white shadow-pop">
      <p className="text-white/60">{label}</p>
      <p className="font-bold">{money ? formatVND(payload[0].value) : `${payload[0].value} đơn`}</p>
    </div>
  );
}

export function Dashboard() {
  const { token } = useAccessToken();
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setStats((await getStatsOverview(token)).data);
      setError('');
    } catch (e) {
      setError(errorMessage(e, 'Lỗi tải thống kê'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const header = (
    <PageHeader
      title="Bảng điều khiển"
      description={<span className="inline-flex items-center gap-1.5 capitalize"><CalendarDays size={15} /> {today}</span>}
      actions={<Button variant="outline" size="sm" leftIcon={<RefreshCw size={15} />} onClick={load} loading={loading && !!stats}>Làm mới</Button>}
    />
  );

  if (error) {
    return (
      <>
        {header}
        <EmptyState tone="danger" title="Không tải được thống kê" description={error} action={<Button onClick={load}>Thử lại</Button>} />
      </>
    );
  }

  if (!stats) {
    return (
      <>
        {header}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </>
    );
  }

  const statusData = stats.ordersByStatus.map((s) => ({ name: ORDER_STATUS_LABEL[s.status], count: s.count }));
  const pending = stats.ordersByStatus.find((s) => s.status === 'PENDING')?.count ?? 0;
  const week = stats.revenueByDay.reduce((s, d) => s + d.revenue, 0);

  return (
    <>
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi accent label="Doanh thu hôm nay" value={formatVND(stats.revenueToday)} hint={`Tháng này: ${formatVND(stats.revenueMonth)}`} icon={Wallet} />
        <Kpi label="Tổng doanh thu" value={formatVND(stats.revenueTotal)} hint="Đơn đã xác nhận → đã giao" icon={TrendingUp} />
        <Kpi label="Đơn hàng" value={String(stats.totalOrders)} hint={pending ? `${pending} đơn chờ xác nhận` : 'Không có đơn chờ'} icon={ShoppingCart} />
        <Kpi label="Khách hàng" value={String(stats.totalCustomers)} hint={`+${stats.newCustomers} trong tháng`} icon={Users} />
      </div>

      {pending > 0 && (
        <Link href="/admin/orders?status=PENDING" className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-lime-400 px-5 py-3.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90">
          <span>Có {pending} đơn hàng đang chờ xác nhận</span>
          <span className="inline-flex items-center gap-1">Xử lý ngay <ArrowUpRight size={16} /></span>
        </Link>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-bold">Doanh thu 7 ngày</h2>
              <p className="text-sm text-ink-3">Tổng: <b className="text-ink">{formatVND(week)}</b></p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.revenueByDay} margin={{ left: -10, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.brand} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={C.line} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: C.muted }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: C.muted }} width={56} tickFormatter={(v) => compactVND(Number(v))} />
              <Tooltip content={<ChartTooltip money />} cursor={{ stroke: C.ink, strokeDasharray: 4 }} />
              <Area type="monotone" dataKey="revenue" stroke={C.brand} strokeWidth={2.5} fill="url(#rev)" dot={{ r: 3, fill: C.brand }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="mb-5 font-bold">Đơn theo trạng thái</h2>
          {statusData.length === 0 ? (
            <p className="py-20 text-center text-sm text-ink-3">Chưa có đơn hàng.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid horizontal={false} stroke={C.line} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: C.muted }} />
                <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: C.ink }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F2F2EE' }} />
                <Bar dataKey="count" fill={C.ink} radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <h2 className="mb-4 font-bold">Sản phẩm bán chạy</h2>
          {stats.topProducts.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-3">Chưa có dữ liệu bán hàng.</p>
          ) : (
            <ul className="space-y-3">
              {stats.topProducts.map((p, i) => {
                const max = stats.topProducts[0].quantity || 1;
                return (
                  <li key={p.name}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={i === 0 ? 'grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-lime-400 text-xs font-bold' : 'grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold'}>{i + 1}</span>
                        <span className="truncate font-semibold">{p.name}</span>
                      </span>
                      <span className="shrink-0 text-ink-3">
                        <b className="text-ink">{p.quantity}</b> đã bán · {formatVND(p.revenue)}
                      </span>
                    </div>
                    <div className="ml-10 mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${(p.quantity / max) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-bold">Truy cập nhanh</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart },
              { href: '/admin/products', label: 'Sản phẩm', icon: Package },
              { href: '/admin/stock', label: 'Nhập kho', icon: Boxes },
              { href: '/admin/customers', label: 'Khách hàng', icon: Users },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex flex-col gap-3 rounded-2xl bg-muted p-4 text-sm font-semibold transition-colors hover:bg-lime-400">
                <Icon size={20} />
                {label}
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-3">{stats.totalProducts} sản phẩm đang có trong hệ thống.</p>
        </Card>
      </div>
    </>
  );
}
