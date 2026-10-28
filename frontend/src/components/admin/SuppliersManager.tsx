'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Mail, Pencil, Phone, Plus, Search, Trash2 } from 'lucide-react';
import { createSupplier, deleteSupplierApi, getSuppliers, updateSupplierApi } from '@/lib/api';
import { useAccessToken } from '@/hooks/useAccessToken';
import { useDebounce } from '@/hooks/useDebounce';
import { errorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/misc';
import type { Supplier } from '@/lib/types';

const EMPTY = { id: '', name: '', contactPerson: '', phone: '', email: '', address: '', taxCode: '' };

export function SuppliersManager() {
  const { token } = useAccessToken();
  const confirm = useConfirm();
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [term, setTerm] = useState('');
  const search = useDebounce(term.trim());
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setItems((await getSuppliers(token, search || undefined)).data);
      setError('');
    } catch (e) {
      setError(errorMessage(e, 'Lỗi tải nhà cung cấp'));
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const { id, ...rest } = form;
      // Giữ chuỗi rỗng (backend chấp nhận '') để người dùng xóa được giá trị cũ khi sửa
      const payload = Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v.trim()])) as Partial<Supplier>;
      if (id) await updateSupplierApi(token, id, payload);
      else await createSupplier(token, payload);
      toast.success(id ? 'Đã cập nhật nhà cung cấp' : 'Đã thêm nhà cung cấp');
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Lưu thất bại'));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(s: Supplier) {
    if (!token) return;
    const ok = await confirm({ title: `Xóa “${s.name}”?`, description: s._count?.products ? `Nhà cung cấp đang gắn với ${s._count.products} sản phẩm.` : 'Thao tác này không thể hoàn tác.', confirmText: 'Xóa', danger: true });
    if (!ok) return;
    try {
      await deleteSupplierApi(token, s.id);
      toast.success('Đã xóa nhà cung cấp');
      await load();
    } catch (e) {
      toast.error(errorMessage(e, 'Xóa thất bại'));
    }
  }

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      header: 'Nhà cung cấp',
      cell: (s) => (
        <div>
          <p className="font-semibold">{s.name}</p>
          {s.address && <p className="line-clamp-1 text-xs text-ink-3">{s.address}</p>}
        </div>
      ),
    },
    { key: 'contact', header: 'Người liên hệ', hideOnMobile: true, cell: (s) => s.contactPerson ?? '—' },
    {
      key: 'reach',
      header: 'Liên lạc',
      hideOnMobile: true,
      cell: (s) => (
        <div className="space-y-0.5 text-xs text-ink-2">
          {s.phone && <p className="flex items-center gap-1.5"><Phone size={12} /> {s.phone}</p>}
          {s.email && <p className="flex items-center gap-1.5"><Mail size={12} /> {s.email}</p>}
          {!s.phone && !s.email && '—'}
        </div>
      ),
    },
    { key: 'count', header: 'Sản phẩm', align: 'right', cell: (s) => <span className="font-semibold">{s._count?.products ?? 0}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (s) => (
        <div className="flex justify-end gap-1">
          <Button size="icon-sm" variant="ghost" aria-label={`Sửa ${s.name}`} onClick={() => { setForm({ id: s.id, name: s.name, contactPerson: s.contactPerson ?? '', phone: s.phone ?? '', email: s.email ?? '', address: s.address ?? '', taxCode: s.taxCode ?? '' }); setOpen(true); }}>
            <Pencil size={15} />
          </Button>
          <Button size="icon-sm" variant="ghost" className="hover:bg-danger-soft hover:text-danger" aria-label={`Xóa ${s.name}`} onClick={() => onDelete(s)}>
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Nhà cung cấp" description={`${items.length} nhà cung cấp`} actions={<Button leftIcon={<Plus size={17} />} onClick={() => { setForm(EMPTY); setOpen(true); }}>Thêm nhà cung cấp</Button>} />
      <Input wrapperClassName="mb-4 max-w-md" placeholder="Tìm theo tên, SĐT, email..." leftIcon={<Search size={16} />} value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Tìm nhà cung cấp" />
      {error && <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
      <DataTable columns={columns} rows={items} rowKey={(s) => s.id} loading={loading} emptyTitle={search ? 'Không tìm thấy nhà cung cấp' : 'Chưa có nhà cung cấp'} />

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        size="lg"
        title={form.id ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Hủy</Button>
            <Button type="submit" form="supplier-form" loading={saving}>{form.id ? 'Lưu' : 'Thêm'}</Button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <Input label="Tên nhà cung cấp" required maxLength={200} wrapperClassName="sm:col-span-2" value={form.name} onChange={set('name')} />
          <Input label="Người liên hệ" maxLength={100} value={form.contactPerson} onChange={set('contactPerson')} />
          <Input label="Điện thoại" type="tel" maxLength={15} value={form.phone} onChange={set('phone')} />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} />
          <Input label="Mã số thuế" maxLength={20} value={form.taxCode} onChange={set('taxCode')} />
          <Input label="Địa chỉ" maxLength={500} wrapperClassName="sm:col-span-2" value={form.address} onChange={set('address')} />
        </form>
      </Modal>
    </>
  );
}
