'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cancelOrder, getMyOrder, reconcileOrder } from '@/lib/api';
import { formatVND } from '@/lib/utils';
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '@/lib/orderStatus';
import { Button } from '@/components/ui/Button';
import type { Order } from '@/lib/types';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState('');

  const justPaid = params.get('paid') === '1';
  const canceled = params.get('canceled') === '1';

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      // Quay về từ PayOS → đối soát trạng thái trước
      const r = justPaid ? await reconcileOrder(token, id) : await getMyOrder(token, id);
      setOrder(r.data);
      if (justPaid) {
        setBanner(
          r.data.payment?.status === 'PAID'
            ? 'Thanh toán thành công! Cảm ơn bạn.'
            : 'Đã ghi nhận. Trạng thái thanh toán sẽ cập nhật trong giây lát.',
        );
      } else if (canceled) {
        setBanner('Bạn đã hủy thanh toán. Đơn vẫn ở trạng thái chờ — có thể thanh toán lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, id, justPaid, canceled]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCancel() {
    if (!token || !id) return;
    const r = await cancelOrder(token, id);
    setOrder(r.data);
  }

  if (loading) {
    return <div className="container-page pt-[calc(var(--header-h)+3rem)] text-mist">Đang tải...</div>;
  }
  if (!order) {
    return (
      <div className="container-page pt-[calc(var(--header-h)+3rem)]">
        <p className="text-mist">Không tìm thấy đơn hàng.</p>
      </div>
    );
  }

  return (
    <div className="container-page min-h-screen pt-[calc(var(--header-h)+2.5rem)]">
      <button onClick={() => router.push('/orders')} className="link-underline mb-6 text-sm text-mist">
        ← Đơn hàng của tôi
      </button>

      {banner && (
        <p className="mb-6 rounded-xl2 border border-line bg-bone p-4 text-sm text-graphite">{banner}</p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Đơn hàng</p>
          <h1 className="text-display-md">{order.code}</h1>
        </div>
        <div className="text-right">
          <p className="font-display text-lg text-clay">{ORDER_STATUS_LABEL[order.status]}</p>
          {order.payment && (
            <p className="text-sm text-mist">
              {order.payment.method} · {PAYMENT_STATUS_LABEL[order.payment.status]}
            </p>
          )}
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-line border-y border-line">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between py-4">
                <div>
                  <p className="font-medium">{it.productName}</p>
                  <p className="text-sm text-mist">
                    {[it.size, it.color].filter(Boolean).join(' · ') || 'Mặc định'} × {it.quantity}
                  </p>
                </div>
                <p>{formatVND(it.lineTotal)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6 text-sm text-graphite">
            <p className="font-medium text-ink">Giao tới</p>
            <p>{order.receiverName} · {order.receiverPhone}</p>
            <p>{order.shippingAddress}</p>
            {order.note && <p className="mt-1 italic">Ghi chú: {order.note}</p>}
          </div>
        </div>

        <aside className="h-fit rounded-xl2 border border-line bg-bone p-6">
          <div className="space-y-2 border-b border-line pb-4 text-sm text-graphite">
            <div className="flex justify-between"><span>Tạm tính</span><span>{formatVND(order.subtotal)}</span></div>
            <div className="flex justify-between"><span>Vận chuyển</span><span>{formatVND(order.shippingFee)}</span></div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between"><span>Giảm giá</span><span>−{formatVND(order.discount)}</span></div>
            )}
          </div>
          <div className="flex justify-between py-4 font-display text-xl">
            <span>Tổng</span><span className="text-clay">{formatVND(order.total)}</span>
          </div>

          {order.payment?.status === 'UNPAID' && order.payment.method === 'PAYOS' && order.payment.checkoutUrl && (
            <a href={order.payment.checkoutUrl} className="btn-primary mb-3 w-full">Thanh toán lại</a>
          )}
          {order.status === 'PENDING' && (
            <Button variant="outline" className="w-full" onClick={onCancel}>Hủy đơn</Button>
          )}
        </aside>
      </div>
    </div>
  );
}
