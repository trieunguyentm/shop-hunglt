'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getMyOrders } from '@/lib/api';
import { formatVND } from '@/lib/utils';
import { ORDER_STATUS_LABEL } from '@/lib/orderStatus';
import { ButtonLink } from '@/components/ui/Button';
import type { Order } from '@/lib/types';

export default function OrdersPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  useEffect(() => {
    // Chưa có token (đang khôi phục phiên hoặc phiên đã hết) → không kẹt "Đang tải".
    // SessionGuard sẽ điều hướng về /login nếu phiên thực sự đã chết.
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getMyOrders(token)
      .then((r) => {
        setOrders(r.data);
        setError('');
      })
      .catch((e: unknown) => {
        // Không nuốt lỗi: nếu không có .catch, 401 sẽ thành unhandled rejection và
        // giao diện hiển thị nhầm "Bạn chưa có đơn hàng nào".
        setError(e instanceof Error ? e.message : 'Không tải được đơn hàng');
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="container-page min-h-screen pt-[calc(var(--header-h)+3rem)]">
      <h1 className="mb-10 text-display-md">Đơn hàng của tôi</h1>

      {loading ? (
        <p className="text-mist">Đang tải...</p>
      ) : error ? (
        <p className="rounded-xl2 border border-dashed border-line bg-bone p-6 text-sm text-mist">
          {error}
        </p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-line bg-bone p-12 text-center">
          <p className="mb-6 text-mist">Bạn chưa có đơn hàng nào.</p>
          <ButtonLink href="/products">Mua sắm ngay</ButtonLink>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className="flex items-center justify-between rounded-xl2 border border-line p-5 transition-colors hover:border-ink"
              >
                <div>
                  <p className="font-display text-lg">{o.code}</p>
                  <p className="text-sm text-mist">
                    {new Date(o.orderedAt).toLocaleDateString('vi-VN')} · {o.items.length} sản phẩm ·{' '}
                    {o.payment?.method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatVND(o.total)}</p>
                  <p className="text-sm text-clay">{ORDER_STATUS_LABEL[o.status]}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
