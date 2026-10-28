'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, MapPin, Phone, User } from 'lucide-react';
import { getAdminOrder, getAdminOrders, updateOrderStatus } from '@/lib/api';
import { useAdminList } from '@/hooks/useAdminList';
import { errorMessage, formatDateTime, formatVND } from '@/lib/utils';
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  ORDER_TRANSITIONS,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
} from '@/lib/orderStatus';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Card, PageHeader, Segmented } from '@/components/ui/misc';
import { Select } from '@/components/ui/Select';
import { LoadingBlock } from '@/components/ui/Spinner';
import type { Order, OrderStatus } from '@/lib/types';

type Filter = '' | OrderStatus;

/** Nút hành động gợi ý cho bước tiếp theo trong luồng đơn. */
const NEXT_ACTION: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  PENDING: { to: 'CONFIRMED', label: 'Xác nhận đơn' },
  CONFIRMED: { to: 'PACKING', label: 'Bắt đầu đóng gói' },
  PACKING: { to: 'SHIPPING', label: 'Giao cho vận chuyển' },
  SHIPPING: { to: 'DELIVERED', label: 'Đã giao thành công' },
};

export function OrdersManager() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const confirm = useConfirm();
  const initial = (params.get('status') ?? '') as Filter;
  const [filter, setFilter] = useState<Filter>(ORDER_STATUSES.includes(initial as OrderStatus) ? initial : '');
  const list = useAdminList(getAdminOrders, { status: filter || undefined });

  const [detail, setDetail] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Giữ bộ lọc trên URL (dashboard có thể link thẳng tới ?status=PENDING)
  useEffect(() => {
    router.replace(filter ? `${pathname}?status=${filter}` : pathname, { scroll: false });
  }, [filter, pathname, router]);

  async function open(o: Order) {
    if (!list.token) return;
    setDetail(o);
    setDetailLoading(true);
    try {
      setDetail((await getAdminOrder(list.token, o.id)).data);
    } catch (e) {
      toast.error(errorMessage(e, 'Không tải được chi tiết đơn'));
    } finally {
      setDetailLoading(false);
    }
  }

  async function changeStatus(order: Order, status: OrderStatus) {
    if (!list.token || status === order.status) return;
    if (status === 'CANCELLED' || status === 'RETURNED') {
      const ok = await confirm({
        title: status === 'CANCELLED' ? 'Hủy đơn hàng?' : 'Ghi nhận trả hàng?',
        description: `Đơn ${order.code} sẽ chuyển sang “${ORDER_STATUS_LABEL[status]}” và hàng được hoàn lại kho. Thao tác này không thể hoàn tác.`,
        confirmText: ORDER_STATUS_LABEL[status],
        danger: true,
      });
      if (!ok) return;
    }
    setSaving(true);
    try {
      const updated = (await updateOrderStatus(list.token, order.id, status)).data;
      setDetail((d) => (d && d.id === order.id ? { ...d, ...updated } : d));
      toast.success(`Đơn ${order.code}: ${ORDER_STATUS_LABEL[status]}`);
      await list.reload();
    } catch (e) {
      toast.error(errorMessage(e, 'Cập nhật thất bại'));
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Order>[] = [
    { key: 'code', header: 'Mã đơn', cell: (o) => <span className="whitespace-nowrap font-bold">{o.code}</span> },
    { key: 'customer', header: 'Khách hàng', cell: (o) => o.customer?.fullName ?? o.receiverName },
    { key: 'date', header: 'Ngày đặt', hideOnMobile: true, cell: (o) => <span className="text-ink-3">{formatDateTime(o.orderedAt)}</span> },
    { key: 'total', header: 'Tổng tiền', align: 'right', cell: (o) => <span className="whitespace-nowrap font-semibold">{formatVND(o.total)}</span> },
    {
      key: 'payment',
      header: 'Thanh toán',
      hideOnMobile: true,
      cell: (o) => (o.payment ? <Badge tone={PAYMENT_STATUS_TONE[o.payment.status]}>{o.payment.method} · {PAYMENT_STATUS_LABEL[o.payment.status]}</Badge> : '—'),
    },
    { key: 'status', header: 'Trạng thái', cell: (o) => <Badge tone={ORDER_STATUS_TONE[o.status]} dot>{ORDER_STATUS_LABEL[o.status]}</Badge> },
  ];

  const next = detail ? NEXT_ACTION[detail.status] : undefined;
  const allowed = detail ? ORDER_TRANSITIONS[detail.status] : [];

  return (
    <>
      <PageHeader title="Đơn hàng" description={`${list.total} đơn hàng${filter ? ` · ${ORDER_STATUS_LABEL[filter]}` : ''}`} />

      <Segmented<Filter>
        className="mb-5"
        value={filter}
        onChange={setFilter}
        options={[{ value: '', label: 'Tất cả' }, ...ORDER_STATUSES.map((s) => ({ value: s as Filter, label: ORDER_STATUS_LABEL[s] }))]}
      />

      {list.error && <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{list.error}</p>}

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(o) => o.id}
        loading={list.loading}
        onRowClick={open}
        emptyTitle="Chưa có đơn hàng"
        emptyDescription={filter ? 'Không có đơn ở trạng thái này.' : undefined}
        footer={list.totalPages > 1 ? <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} /> : undefined}
      />

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        variant="right"
        title={detail ? `Đơn ${detail.code}` : ''}
        description={detail ? `Đặt lúc ${formatDateTime(detail.orderedAt)}` : undefined}
        footer={
          detail && allowed.length > 0 ? (
            <div className="flex w-full flex-wrap items-center gap-2">
              <Select
                size="sm"
                aria-label="Chuyển trạng thái"
                value=""
                placeholder="Chuyển trạng thái..."
                wrapperClassName="flex-1 min-w-[180px]"
                options={allowed.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))}
                onChange={(v) => changeStatus(detail, v as OrderStatus)}
                disabled={saving}
              />
              {next && (
                <Button size="sm" loading={saving} rightIcon={<ArrowRight size={15} />} onClick={() => changeStatus(detail, next.to)}>
                  {next.label}
                </Button>
              )}
            </div>
          ) : undefined
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={ORDER_STATUS_TONE[detail.status]} dot className="text-sm">{ORDER_STATUS_LABEL[detail.status]}</Badge>
              {detail.payment && <Badge tone={PAYMENT_STATUS_TONE[detail.payment.status]}>{PAYMENT_STATUS_LABEL[detail.payment.status]}</Badge>}
            </div>

            <Card className="p-4 sm:p-5">
              <p className="eyebrow mb-3">Người nhận</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2.5"><User size={15} className="text-ink-3" /> {detail.receiverName}</li>
                <li className="flex items-center gap-2.5"><Phone size={15} className="text-ink-3" /> <a href={`tel:${detail.receiverPhone}`} className="hover:underline">{detail.receiverPhone}</a></li>
                <li className="flex items-start gap-2.5"><MapPin size={15} className="mt-0.5 shrink-0 text-ink-3" /> {detail.shippingAddress}</li>
              </ul>
              {detail.note && <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm">Ghi chú: {detail.note}</p>}
            </Card>

            <Card className="p-4 sm:p-5">
              <p className="eyebrow mb-3">Sản phẩm</p>
              {detailLoading && !detail.items?.length ? (
                <LoadingBlock className="py-6" />
              ) : (
                <ul className="divide-y divide-line">
                  {detail.items?.map((it) => (
                    <li key={it.id} className="flex justify-between gap-3 py-2.5 text-sm first:pt-0">
                      <span>
                        <span className="font-semibold">{it.productName}</span>
                        <span className="block text-xs text-ink-3">{[it.size, it.color].filter(Boolean).join(' · ') || 'Mặc định'} · {formatVND(it.unitPrice)} × {it.quantity}</span>
                      </span>
                      <span className="font-semibold">{formatVND(it.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                <div className="flex justify-between"><dt className="text-ink-3">Tạm tính</dt><dd>{formatVND(detail.subtotal)}</dd></div>
                {Number(detail.discount) > 0 && <div className="flex justify-between text-success"><dt>Giảm giá</dt><dd>−{formatVND(detail.discount)}</dd></div>}
                <div className="flex justify-between"><dt className="text-ink-3">Vận chuyển</dt><dd>{formatVND(detail.shippingFee)}</dd></div>
                <div className="flex justify-between pt-1 text-base font-extrabold"><dt>Tổng</dt><dd>{formatVND(detail.total)}</dd></div>
              </dl>
              {detail.payment && <p className="mt-3 text-xs text-ink-3">Phương thức: {PAYMENT_METHOD_LABEL[detail.payment.method]}</p>}
            </Card>

            {allowed.length === 0 && <p className="text-center text-sm text-ink-3">Đơn đã ở trạng thái kết thúc — không thể thay đổi.</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
