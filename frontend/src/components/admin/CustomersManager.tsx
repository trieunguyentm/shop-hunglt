'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Crown, Lock, Search, Unlock } from 'lucide-react';
import { getCustomer, getCustomers, updateCustomer } from '@/lib/api';
import { useAdminList } from '@/hooks/useAdminList';
import { useDebounce } from '@/hooks/useDebounce';
import { errorMessage, formatDate, formatVND } from '@/lib/utils';
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from '@/lib/orderStatus';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Avatar, Card, PageHeader } from '@/components/ui/misc';
import { LoadingBlock } from '@/components/ui/Spinner';
import type { AdminCustomer, AdminCustomerDetail } from '@/lib/types';

export function CustomersManager() {
  const confirm = useConfirm();
  const [term, setTerm] = useState('');
  const search = useDebounce(term.trim());
  const list = useAdminList(getCustomers, { search: search || undefined });
  const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const [detail, setDetail] = useState<AdminCustomerDetail | null>(null);
  const [busy, setBusy] = useState(false);

  async function open(c: AdminCustomer) {
    if (!list.token) return;
    setSelected(c);
    setDetail(null);
    try {
      setDetail((await getCustomer(list.token, c.id)).data);
    } catch (e) {
      toast.error(errorMessage(e, 'Không tải được khách hàng'));
      setSelected(null);
    }
  }

  async function patch(input: { tier?: string; status?: string }, msg: string) {
    if (!list.token || !detail) return;
    if (input.status === 'BANNED') {
      const ok = await confirm({ title: `Khóa tài khoản ${detail.fullName}?`, description: 'Khách sẽ không thể đăng nhập và đặt hàng cho đến khi được mở khóa.', confirmText: 'Khóa tài khoản', danger: true });
      if (!ok) return;
    }
    setBusy(true);
    try {
      setDetail((await updateCustomer(list.token, detail.id, input)).data);
      toast.success(msg);
      await list.reload();
    } catch (e) {
      toast.error(errorMessage(e, 'Cập nhật thất bại'));
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<AdminCustomer>[] = [
    {
      key: 'name',
      header: 'Khách hàng',
      className: 'min-w-[200px]',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.fullName} size={36} />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-semibold">
              <span className="truncate">{c.fullName}</span>
              {c.tier === 'VIP' && <Crown size={14} className="shrink-0 text-star" />}
            </p>
            <p className="truncate text-xs text-ink-3">{c.account.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Điện thoại', hideOnMobile: true, cell: (c) => c.phone ?? '—' },
    { key: 'tier', header: 'Hạng', cell: (c) => (c.tier === 'VIP' ? <Badge tone="lime">VIP</Badge> : <Badge>Thường</Badge>) },
    { key: 'orders', header: 'Số đơn', align: 'right', hideOnMobile: true, cell: (c) => <span className="font-semibold">{c._count?.orders ?? 0}</span> },
    { key: 'joined', header: 'Tham gia', hideOnMobile: true, cell: (c) => <span className="text-ink-3">{formatDate(c.createdAt)}</span> },
    { key: 'status', header: 'Trạng thái', cell: (c) => <Badge tone={c.account.status === 'ACTIVE' ? 'success' : 'danger'} dot>{c.account.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}</Badge> },
  ];

  return (
    <>
      <PageHeader title="Khách hàng" description={`${list.total} khách hàng`} />
      <Input wrapperClassName="mb-4 max-w-md" placeholder="Tìm theo tên, SĐT, email..." leftIcon={<Search size={16} />} value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Tìm khách hàng" />
      {list.error && <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{list.error}</p>}
      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(c) => c.id}
        loading={list.loading}
        onRowClick={open}
        emptyTitle={search ? 'Không tìm thấy khách hàng' : 'Chưa có khách hàng'}
        emptyDescription={search ? undefined : 'Khách hàng xuất hiện sau khi đăng ký và đăng nhập lần đầu.'}
        footer={list.totalPages > 1 ? <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} /> : undefined}
      />

      <Modal open={!!selected} onClose={() => setSelected(null)} variant="right" title={selected?.fullName} description={selected?.account.email}>
        {!detail ? (
          <LoadingBlock />
        ) : (
          <div className="space-y-5">
            <Card className="flex items-center gap-4 p-4">
              <Avatar name={detail.fullName} size={56} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1.5">
                  {detail.tier === 'VIP' ? <Badge tone="lime">VIP</Badge> : <Badge>Thường</Badge>}
                  <Badge tone={detail.account.status === 'ACTIVE' ? 'success' : 'danger'} dot>{detail.account.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}</Badge>
                </div>
                <p className="mt-1.5 text-sm text-ink-3">{detail.phone ?? 'Chưa có SĐT'} · Tham gia {formatDate(detail.createdAt)}</p>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <p className="text-xs text-ink-3">Tổng chi tiêu</p>
                <p className="mt-1 text-xl font-extrabold">{formatVND(detail.totalSpent)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-ink-3">Số đơn hàng</p>
                <p className="mt-1 text-xl font-extrabold">{detail.orders.length}</p>
              </Card>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" leftIcon={<Crown size={15} />} loading={busy} onClick={() => patch({ tier: detail.tier === 'VIP' ? 'REGULAR' : 'VIP' }, detail.tier === 'VIP' ? 'Đã chuyển về hạng Thường' : 'Đã nâng hạng VIP')}>
                {detail.tier === 'VIP' ? 'Bỏ VIP' : 'Nâng hạng VIP'}
              </Button>
              {detail.account.status === 'ACTIVE' ? (
                <Button variant="outline" size="sm" className="text-danger hover:border-danger" leftIcon={<Lock size={15} />} disabled={busy} onClick={() => patch({ status: 'BANNED' }, 'Đã khóa tài khoản')}>
                  Khóa tài khoản
                </Button>
              ) : (
                <Button variant="outline" size="sm" leftIcon={<Unlock size={15} />} disabled={busy} onClick={() => patch({ status: 'ACTIVE' }, 'Đã mở khóa tài khoản')}>
                  Mở khóa
                </Button>
              )}
            </div>

            <div>
              <p className="eyebrow mb-3">Lịch sử đơn hàng</p>
              {detail.orders.length === 0 ? (
                <p className="rounded-2xl bg-muted py-8 text-center text-sm text-ink-3">Chưa có đơn hàng.</p>
              ) : (
                <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
                  {detail.orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div>
                        <p className="font-semibold">{o.code}</p>
                        <p className="text-xs text-ink-3">{formatDate(o.orderedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatVND(o.total)}</p>
                        <Badge tone={ORDER_STATUS_TONE[o.status]} className="mt-1">{ORDER_STATUS_LABEL[o.status]}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
