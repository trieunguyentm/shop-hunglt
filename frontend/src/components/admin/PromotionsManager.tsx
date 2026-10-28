'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { createPromotion, deletePromotionApi, getPromotions, updatePromotionApi } from '@/lib/api';
import { useAccessToken } from '@/hooks/useAccessToken';
import { errorMessage, formatDate, formatVND } from '@/lib/utils';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input, Switch } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/misc';
import { Select } from '@/components/ui/Select';
import type { Promotion } from '@/lib/types';

const EMPTY = {
  id: '',
  name: '',
  code: '',
  discountType: 'PERCENT' as Promotion['discountType'],
  discountValue: '',
  minOrderTotal: '0',
  startDate: '',
  endDate: '',
  quantityLeft: '100',
  isActive: true,
};

/** Trạng thái hiệu lực thực tế của mã (kết hợp cờ bật/tắt, thời gian, số lượt). */
function promoState(p: Promotion): { label: string; tone: BadgeTone } {
  const now = Date.now();
  if (!p.isActive) return { label: 'Tạm tắt', tone: 'neutral' };
  if (new Date(p.endDate).getTime() < now) return { label: 'Hết hạn', tone: 'neutral' };
  if (p.quantityLeft <= 0) return { label: 'Hết lượt', tone: 'warning' };
  if (new Date(p.startDate).getTime() > now) return { label: 'Sắp diễn ra', tone: 'info' };
  return { label: 'Đang chạy', tone: 'success' };
}

const isoDay = (iso: string) => iso.slice(0, 10);

export function PromotionsManager() {
  const { token } = useAccessToken();
  const confirm = useConfirm();
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setItems((await getPromotions(token)).data);
      setError('');
    } catch (e) {
      setError(errorMessage(e, 'Lỗi tải khuyến mãi'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    setForm({ ...EMPTY, startDate: today, endDate: in30 });
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (form.endDate < form.startDate) return toast.error('Ngày kết thúc phải sau ngày bắt đầu');
    if (form.discountType === 'PERCENT' && Number(form.discountValue) > 100) return toast.error('Giảm theo % không vượt quá 100');
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderTotal: Number(form.minOrderTotal) || 0,
      quantityLeft: Number(form.quantityLeft) || 0,
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: form.isActive,
    };
    setSaving(true);
    try {
      if (form.id) await updatePromotionApi(token, form.id, payload);
      else await createPromotion(token, payload);
      toast.success(form.id ? 'Đã cập nhật khuyến mãi' : 'Đã tạo khuyến mãi');
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Lưu thất bại'));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(p: Promotion) {
    if (!token) return;
    const ok = await confirm({ title: `Xóa mã ${p.code}?`, description: 'Khách sẽ không thể dùng mã này nữa.', confirmText: 'Xóa', danger: true });
    if (!ok) return;
    try {
      await deletePromotionApi(token, p.id);
      toast.success('Đã xóa khuyến mãi');
      await load();
    } catch (e) {
      toast.error(errorMessage(e, 'Xóa thất bại'));
    }
  }

  const columns: Column<Promotion>[] = [
    {
      key: 'code',
      header: 'Mã',
      cell: (p) => (
        <div>
          <code className="rounded-lg bg-lime-100 px-2 py-1 text-sm font-bold tracking-wider">{p.code}</code>
          <p className="mt-1 line-clamp-1 text-xs text-ink-3">{p.name}</p>
        </div>
      ),
    },
    { key: 'value', header: 'Giảm', cell: (p) => <span className="font-bold">{p.discountType === 'PERCENT' ? `${Number(p.discountValue)}%` : formatVND(p.discountValue)}</span> },
    { key: 'min', header: 'Đơn tối thiểu', hideOnMobile: true, cell: (p) => formatVND(p.minOrderTotal) },
    { key: 'left', header: 'Còn lượt', align: 'right', cell: (p) => <span className="font-semibold">{p.quantityLeft}</span> },
    { key: 'time', header: 'Hiệu lực', hideOnMobile: true, cell: (p) => <span className="whitespace-nowrap text-ink-3">{formatDate(p.startDate)} → {formatDate(p.endDate)}</span> },
    { key: 'state', header: 'Trạng thái', cell: (p) => { const s = promoState(p); return <Badge tone={s.tone} dot>{s.label}</Badge>; } },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Sửa ${p.code}`}
            onClick={() => {
              setForm({ id: p.id, name: p.name, code: p.code, discountType: p.discountType, discountValue: String(Number(p.discountValue)), minOrderTotal: String(Number(p.minOrderTotal)), quantityLeft: String(p.quantityLeft), startDate: isoDay(p.startDate), endDate: isoDay(p.endDate), isActive: p.isActive });
              setOpen(true);
            }}
          >
            <Pencil size={15} />
          </Button>
          <Button size="icon-sm" variant="ghost" className="hover:bg-danger-soft hover:text-danger" aria-label={`Xóa ${p.code}`} onClick={() => onDelete(p)}>
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Khuyến mãi" description="Mã giảm giá áp dụng ở bước thanh toán" actions={<Button leftIcon={<Plus size={17} />} onClick={openCreate}>Tạo mã giảm giá</Button>} />
      {error && <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
      <DataTable columns={columns} rows={items} rowKey={(p) => p.id} loading={loading} emptyTitle="Chưa có khuyến mãi" />

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        size="lg"
        title={form.id ? `Sửa mã ${form.code}` : 'Tạo mã giảm giá'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Hủy</Button>
            <Button type="submit" form="promo-form" loading={saving}>{form.id ? 'Lưu' : 'Tạo mã'}</Button>
          </>
        }
      >
        <form id="promo-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <Input label="Tên chương trình" required wrapperClassName="sm:col-span-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sale cuối tuần" />
          <Input label="Mã" required pattern="[A-Za-z0-9_\-]+" title="Chữ không dấu, số, _ hoặc -" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SALE20" className="font-bold tracking-wider" />
          <Select label="Loại giảm" value={form.discountType} onChange={(v) => setForm({ ...form, discountType: v as Promotion['discountType'] })} options={[{ value: 'PERCENT', label: 'Theo phần trăm (%)' }, { value: 'FIXED', label: 'Số tiền cố định (đ)' }]} />
          <Input label={form.discountType === 'PERCENT' ? 'Mức giảm (%)' : 'Mức giảm (đ)'} required type="number" min={1} max={form.discountType === 'PERCENT' ? 100 : undefined} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
          <Input label="Đơn tối thiểu (đ)" type="number" min={0} step={1000} value={form.minOrderTotal} onChange={(e) => setForm({ ...form, minOrderTotal: e.target.value })} />
          <Input label="Ngày bắt đầu" required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <Input label="Ngày kết thúc" required type="date" min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          <Input label="Số lượt sử dụng" type="number" min={0} value={form.quantityLeft} onChange={(e) => setForm({ ...form, quantityLeft: e.target.value })} />
          <div className="flex items-end pb-2.5">
            <Switch checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Đang áp dụng" />
          </div>
        </form>
      </Modal>
    </>
  );
}
