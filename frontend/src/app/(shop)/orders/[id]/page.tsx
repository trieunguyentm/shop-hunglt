'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Check, CheckCircle2, Info, MapPin, PackageX, QrCode, XCircle } from 'lucide-react';
import { cancelOrder, getMyOrder, reconcileOrder } from '@/lib/api';
import { useAccessToken } from '@/hooks/useAccessToken';
import { cn, errorMessage, formatDateTime, formatVND } from '@/lib/utils';
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
} from '@/lib/orderStatus';
import { Badge } from '@/components/ui/Badge';
import { Button, ButtonLink, buttonClass } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Order } from '@/lib/types';

/** Thanh tiến trình trạng thái đơn. */
function OrderProgress({ order }: { order: Order }) {
  if (order.status === 'CANCELLED' || order.status === 'RETURNED') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-muted p-4 text-sm">
        <XCircle size={20} className="text-ink-3" />
        Đơn hàng {order.status === 'CANCELLED' ? 'đã bị hủy' : 'đã được trả lại'}.
      </div>
    );
  }
  const current = ORDER_STATUS_FLOW.indexOf(order.status);
  return (
    <ol className="grid grid-cols-5 gap-1">
      {ORDER_STATUS_FLOW.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn('h-1 flex-1 rounded-full', i === 0 ? 'opacity-0' : done ? 'bg-ink' : 'bg-line')} />
              <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-bold', done ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink-4', i === current && 'ring-4 ring-lime-400')}>
                {done ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn('h-1 flex-1 rounded-full', i === ORDER_STATUS_FLOW.length - 1 ? 'opacity-0' : i < current ? 'bg-ink' : 'bg-line')} />
            </div>
            <span className={cn('mt-2 text-2xs font-semibold leading-tight sm:text-xs', done ? 'text-ink' : 'text-ink-3')}>{ORDER_STATUS_LABEL[s]}</span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const { token, ready } = useAccessToken();
  const confirm = useConfirm();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState<{ tone: 'success' | 'info'; text: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const justPaid = params.get('paid') === '1';
  const canceled = params.get('canceled') === '1';
  const placed = params.get('placed') === '1';

  const load = useCallback(async () => {
    if (!token || !id) {
      if (ready) setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Quay về từ PayOS → đối soát trạng thái thanh toán trước
      const r = justPaid ? await reconcileOrder(token, id) : await getMyOrder(token, id);
      setOrder(r.data);
      setError('');
      if (justPaid) {
        setBanner(r.data.payment?.status === 'PAID'
          ? { tone: 'success', text: 'Thanh toán thành công! Cảm ơn bạn đã mua sắm tại MAISON.' }
          : { tone: 'info', text: 'Đã ghi nhận. Trạng thái thanh toán sẽ được cập nhật trong giây lát.' });
      } else if (canceled) {
        setBanner({ tone: 'info', text: 'Bạn đã hủy thanh toán. Đơn vẫn đang chờ — bạn có thể thanh toán lại bất cứ lúc nào.' });
      } else if (placed) {
        setBanner({ tone: 'success', text: 'Đặt hàng thành công! Chúng tôi sẽ sớm liên hệ xác nhận đơn.' });
      }
    } catch (e) {
      setError(errorMessage(e, 'Không tìm thấy đơn hàng'));
    } finally {
      setLoading(false);
    }
  }, [token, ready, id, justPaid, canceled, placed]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCancel() {
    if (!token || !order) return;
    const ok = await confirm({ title: 'Hủy đơn hàng này?', description: `Đơn ${order.code} sẽ bị hủy và không thể khôi phục.`, confirmText: 'Hủy đơn', cancelText: 'Giữ lại', danger: true });
    if (!ok) return;
    setCancelling(true);
    try {
      setOrder((await cancelOrder(token, order.id)).data);
      setBanner(null);
      toast.success('Đã hủy đơn hàng');
    } catch (e) {
      toast.error(errorMessage(e, 'Hủy đơn thất bại'));
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="container-page page-top max-w-5xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 rounded-3xl" />
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-page page-top max-w-5xl">
        <EmptyState icon={<PackageX size={24} />} title="Không tìm thấy đơn hàng" description={error} action={<ButtonLink href="/orders">Về danh sách đơn</ButtonLink>} />
      </div>
    );
  }

  const canPayAgain = order.payment?.status === 'UNPAID' && order.payment.method === 'PAYOS' && order.payment.checkoutUrl && order.status === 'PENDING';

  return (
    <div className="container-page page-top max-w-5xl">
      <ButtonLink href="/orders" variant="ghost" size="sm" className="-ml-3 mb-4" leftIcon={<ArrowLeft size={16} />}>
        Đơn hàng của tôi
      </ButtonLink>

      {banner && (
        <div className={cn('mb-6 flex items-start gap-3 rounded-2xl p-4 text-sm font-medium', banner.tone === 'success' ? 'bg-success-soft text-success' : 'bg-info-soft text-info')}>
          {banner.tone === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <Info size={20} className="shrink-0" />}
          {banner.text}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Mã đơn</p>
          <h1 className="heading-1">{order.code}</h1>
          <p className="mt-1 text-sm text-ink-3">Đặt lúc {formatDateTime(order.orderedAt)}</p>
        </div>
        <Badge tone={ORDER_STATUS_TONE[order.status]} dot className="px-3 py-1.5 text-sm">{ORDER_STATUS_LABEL[order.status]}</Badge>
      </div>

      <Card className="mb-6">
        <OrderProgress order={order} />
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-bold">Sản phẩm ({order.items.length})</h2>
            <ul className="divide-y divide-line">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-semibold">{it.productName}</p>
                    <p className="mt-0.5 text-sm text-ink-3">
                      {[it.size, it.color].filter(Boolean).join(' · ') || 'Mặc định'} · {formatVND(it.unitPrice)} × {it.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">{formatVND(it.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-bold"><MapPin size={18} /> Giao tới</h2>
            <p className="font-semibold">{order.receiverName} · {order.receiverPhone}</p>
            <p className="mt-1 text-sm text-ink-2">{order.shippingAddress}</p>
            {order.note && <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm text-ink-2">Ghi chú: {order.note}</p>}
          </Card>
        </div>

        <Card as="aside" className="lg:sticky lg:top-[calc(var(--header-h)+24px)]">
          <h2 className="font-bold">Thanh toán</h2>
          {order.payment && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-ink-2">{PAYMENT_METHOD_LABEL[order.payment.method]}</span>
              <Badge tone={PAYMENT_STATUS_TONE[order.payment.status]}>{PAYMENT_STATUS_LABEL[order.payment.status]}</Badge>
            </div>
          )}
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink-3">Tạm tính</dt><dd className="font-semibold">{formatVND(order.subtotal)}</dd></div>
            {Number(order.discount) > 0 && <div className="flex justify-between text-success"><dt>Giảm giá</dt><dd className="font-semibold">−{formatVND(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-3">Vận chuyển</dt><dd className="font-semibold">{formatVND(order.shippingFee)}</dd></div>
          </dl>
          <div className="my-4 h-px bg-line" />
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Tổng</span>
            <span className="text-2xl font-extrabold">{formatVND(order.total)}</span>
          </div>

          <div className="mt-6 space-y-2">
            {canPayAgain && (
              <a href={order.payment!.checkoutUrl!} className={buttonClass({ variant: 'brand', size: 'lg', block: true })}>
                <QrCode size={18} /> Thanh toán ngay
              </a>
            )}
            {order.status === 'PENDING' && (
              <Button variant="outline" block onClick={onCancel} loading={cancelling}>
                Hủy đơn hàng
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense>
      <OrderDetail />
    </Suspense>
  );
}
