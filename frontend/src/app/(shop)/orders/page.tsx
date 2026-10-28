'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Package } from 'lucide-react';
import { getMyOrders } from '@/lib/api';
import { useAccessToken } from '@/hooks/useAccessToken';
import { errorMessage, formatDate, formatVND } from '@/lib/utils';
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE, PAYMENT_METHOD_SHORT } from '@/lib/orderStatus';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader, Segmented } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Order, OrderStatus } from '@/lib/types';

type Tab = 'ALL' | 'ACTIVE' | 'DELIVERED' | 'CLOSED';
const ACTIVE: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING'];
const CLOSED: OrderStatus[] = ['CANCELLED', 'RETURNED'];

export default function OrdersPage() {
  const { token, ready } = useAccessToken();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('ALL');

  function load() {
    if (!token) {
      if (ready) setLoading(false);
      return;
    }
    setLoading(true);
    getMyOrders(token)
      .then((r) => {
        setOrders(r.data);
        setError('');
      })
      .catch((e: unknown) => setError(errorMessage(e, 'Không tải được đơn hàng')))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [token, ready]);

  const filtered = useMemo(() => {
    if (tab === 'ACTIVE') return orders.filter((o) => ACTIVE.includes(o.status));
    if (tab === 'DELIVERED') return orders.filter((o) => o.status === 'DELIVERED');
    if (tab === 'CLOSED') return orders.filter((o) => CLOSED.includes(o.status));
    return orders;
  }, [orders, tab]);

  const count = (t: Tab) =>
    t === 'ALL' ? orders.length : t === 'ACTIVE' ? orders.filter((o) => ACTIVE.includes(o.status)).length : t === 'DELIVERED' ? orders.filter((o) => o.status === 'DELIVERED').length : orders.filter((o) => CLOSED.includes(o.status)).length;

  return (
    <div className="container-page page-top max-w-4xl">
      <PageHeader eyebrow="Tài khoản" title="Đơn hàng của tôi" description="Theo dõi trạng thái và lịch sử mua hàng." />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
      ) : error ? (
        <EmptyState tone="danger" title="Không tải được đơn hàng" description={error} action={<Button onClick={load}>Thử lại</Button>} />
      ) : orders.length === 0 ? (
        <EmptyState icon={<Package size={24} />} title="Bạn chưa có đơn hàng nào" description="Đơn hàng sẽ xuất hiện ở đây sau khi bạn đặt mua." action={<ButtonLink href="/products">Mua sắm ngay</ButtonLink>} />
      ) : (
        <>
          <Segmented<Tab>
            className="mb-5"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'ALL', label: 'Tất cả', count: count('ALL') },
              { value: 'ACTIVE', label: 'Đang xử lý', count: count('ACTIVE') },
              { value: 'DELIVERED', label: 'Đã giao', count: count('DELIVERED') },
              { value: 'CLOSED', label: 'Hủy / trả', count: count('CLOSED') },
            ]}
          />
          {filtered.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-line-strong py-12 text-center text-sm text-ink-3">Không có đơn nào ở mục này.</p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((o) => (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}`} className="group flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 transition-all hover:border-ink hover:shadow-soft sm:p-5">
                    <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted text-ink sm:grid">
                      <Package size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold">{o.code}</p>
                        <Badge tone={ORDER_STATUS_TONE[o.status]} dot>{ORDER_STATUS_LABEL[o.status]}</Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-ink-3">
                        {formatDate(o.orderedAt)} · {o.items.length} sản phẩm · {o.payment ? PAYMENT_METHOD_SHORT[o.payment.method] : '—'}
                      </p>
                    </div>
                    <p className="text-right font-extrabold">{formatVND(o.total)}</p>
                    <ChevronRight size={18} className="shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
