'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Phone, Reply } from 'lucide-react';
import { getContactMessages, updateContactStatus } from '@/lib/api';
import { useAdminList } from '@/hooks/useAdminList';
import { errorMessage, formatDateTime } from '@/lib/utils';
import { CONTACT_STATUS_LABEL, CONTACT_STATUS_TONE } from '@/lib/orderStatus';
import { Badge } from '@/components/ui/Badge';
import { buttonClass } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeader, Segmented } from '@/components/ui/misc';
import { Select } from '@/components/ui/Select';
import type { ContactMessage } from '@/lib/types';

type Filter = '' | ContactMessage['status'];
const STATUS_OPTIONS = Object.entries(CONTACT_STATUS_LABEL).map(([value, label]) => ({ value, label }));

export function ContactManager() {
  const [filter, setFilter] = useState<Filter>('');
  const list = useAdminList(getContactMessages, { status: filter || undefined });
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [saving, setSaving] = useState(false);

  async function changeStatus(m: ContactMessage, status: string) {
    if (!list.token || status === m.status) return;
    setSaving(true);
    try {
      await updateContactStatus(list.token, m.id, status);
      setSelected((s) => (s && s.id === m.id ? { ...s, status: status as ContactMessage['status'] } : s));
      toast.success(`Đã chuyển sang “${CONTACT_STATUS_LABEL[status]}”`);
      await list.reload();
    } catch (e) {
      toast.error(errorMessage(e, 'Cập nhật thất bại'));
    } finally {
      setSaving(false);
    }
  }

  // Mở tin "Mới" → tự chuyển sang "Đang xử lý" để nhân viên khác biết đã có người nhận
  function open(m: ContactMessage) {
    setSelected(m);
    if (m.status === 'NEW') void changeStatus(m, 'IN_PROGRESS');
  }

  const columns: Column<ContactMessage>[] = [
    {
      key: 'from',
      header: 'Người gửi',
      cell: (m) => (
        <div className="min-w-0">
          <p className={m.status === 'NEW' ? 'font-bold' : 'font-semibold'}>{m.fullName}</p>
          <p className="truncate text-xs text-ink-3">{m.email}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Nội dung',
      className: 'min-w-[200px]',
      cell: (m) => (
        <div className="max-w-md">
          <p className="line-clamp-1 font-semibold">{m.subject}</p>
          <p className="line-clamp-1 text-xs text-ink-3">{m.content}</p>
        </div>
      ),
    },
    { key: 'date', header: 'Thời gian', hideOnMobile: true, cell: (m) => <span className="whitespace-nowrap text-ink-3">{formatDateTime(m.createdAt)}</span> },
    { key: 'status', header: 'Trạng thái', cell: (m) => <Badge tone={CONTACT_STATUS_TONE[m.status]} dot>{CONTACT_STATUS_LABEL[m.status]}</Badge> },
  ];

  return (
    <>
      <PageHeader title="Liên hệ" description="Tin nhắn khách gửi từ trang Liên hệ" />
      <Segmented<Filter> className="mb-5" value={filter} onChange={setFilter} options={[{ value: '', label: 'Tất cả' }, ...STATUS_OPTIONS.map((o) => ({ value: o.value as Filter, label: o.label }))]} />
      {list.error && <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{list.error}</p>}
      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(m) => m.id}
        loading={list.loading}
        onRowClick={open}
        emptyTitle="Không có tin nhắn"
        footer={list.totalPages > 1 ? <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} /> : undefined}
      />

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        size="lg"
        title={selected?.subject}
        description={selected ? formatDateTime(selected.createdAt) : undefined}
        footer={
          selected && (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <Select size="sm" aria-label="Trạng thái xử lý" wrapperClassName="w-48" value={selected.status} onChange={(v) => changeStatus(selected, v)} options={STATUS_OPTIONS} disabled={saving} />
              <a href={`mailto:${selected.email}?subject=${encodeURIComponent('Re: ' + selected.subject)}`} className={buttonClass({ size: 'sm' })}>
                <Reply size={15} /> Trả lời qua email
              </a>
            </div>
          )
        }
      >
        {selected && (
          <div>
            <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 rounded-2xl bg-muted p-4 text-sm">
              <span className="font-semibold">{selected.fullName}</span>
              <span className="flex items-center gap-1.5 text-ink-2"><Mail size={14} /> {selected.email}</span>
              {selected.phone && <span className="flex items-center gap-1.5 text-ink-2"><Phone size={14} /> {selected.phone}</span>}
            </div>
            <p className="whitespace-pre-wrap leading-relaxed text-ink-2">{selected.content}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
