'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CornerDownRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { createCategory, deleteCategoryApi, getCategories, updateCategoryApi } from '@/lib/api';
import { useAccessToken } from '@/hooks/useAccessToken';
import { errorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/misc';
import { Select } from '@/components/ui/Select';
import type { Category } from '@/lib/types';

const EMPTY = { id: '', name: '', description: '', parentId: '' };

export function CategoriesManager() {
  const { token } = useAccessToken();
  const confirm = useConfirm();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await getCategories()).data);
      setError('');
    } catch (e) {
      setError(errorMessage(e, 'Lỗi tải danh mục'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Sắp cha trước, con ngay sau cha (hiển thị dạng cây)
  const rows = useMemo(() => {
    const roots = items.filter((c) => !c.parentId || !items.some((p) => p.id === c.parentId));
    return roots.flatMap((r) => [r, ...items.filter((c) => c.parentId === r.id)]);
  }, [items]);
  const nameOf = (id?: string | null) => items.find((c) => c.id === id)?.name;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), description: form.description.trim() || undefined, parentId: form.parentId || null };
      if (form.id) await updateCategoryApi(token, form.id, payload);
      else await createCategory(token, payload);
      toast.success(form.id ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục');
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Lưu thất bại'));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(c: Category) {
    if (!token) return;
    const ok = await confirm({
      title: `Xóa danh mục “${c.name}”?`,
      description: c._count?.products ? `Danh mục đang có ${c._count.products} sản phẩm — hệ thống sẽ từ chối xóa.` : 'Thao tác này không thể hoàn tác.',
      confirmText: 'Xóa',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteCategoryApi(token, c.id);
      toast.success('Đã xóa danh mục');
      await load();
    } catch (e) {
      toast.error(errorMessage(e, 'Xóa thất bại'));
    }
  }

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Tên danh mục',
      cell: (c) => (
        <span className="flex items-center gap-2 font-semibold">
          {c.parentId && <CornerDownRight size={15} className="text-ink-4" />}
          {c.name}
        </span>
      ),
    },
    { key: 'slug', header: 'Đường dẫn', hideOnMobile: true, cell: (c) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/{c.slug}</code> },
    { key: 'parent', header: 'Danh mục cha', hideOnMobile: true, cell: (c) => <span className="text-ink-3">{nameOf(c.parentId) ?? '—'}</span> },
    { key: 'count', header: 'Sản phẩm', align: 'right', cell: (c) => <span className="font-semibold">{c._count?.products ?? 0}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <Button size="icon-sm" variant="ghost" aria-label={`Sửa ${c.name}`} onClick={() => { setForm({ id: c.id, name: c.name, description: c.description ?? '', parentId: c.parentId ?? '' }); setOpen(true); }}>
            <Pencil size={15} />
          </Button>
          <Button size="icon-sm" variant="ghost" className="hover:bg-danger-soft hover:text-danger" aria-label={`Xóa ${c.name}`} onClick={() => onDelete(c)}>
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Danh mục" description={`${items.length} danh mục sản phẩm`} actions={<Button leftIcon={<Plus size={17} />} onClick={() => { setForm(EMPTY); setOpen(true); }}>Thêm danh mục</Button>} />
      {error && <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
      <DataTable columns={columns} rows={rows} rowKey={(c) => c.id} loading={loading} emptyTitle="Chưa có danh mục" />

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={form.id ? 'Sửa danh mục' : 'Thêm danh mục'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Hủy</Button>
            <Button type="submit" form="category-form" loading={saving}>{form.id ? 'Lưu' : 'Thêm'}</Button>
          </>
        }
      >
        <form id="category-form" onSubmit={onSubmit} className="space-y-4">
          <Input label="Tên danh mục" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Áo khoác" />
          <Select
            label="Danh mục cha"
            hint="Để trống nếu là danh mục gốc"
            value={form.parentId}
            onChange={(v) => setForm({ ...form, parentId: v })}
            options={[{ value: '', label: '— Danh mục gốc —' }, ...items.filter((c) => c.id !== form.id && !c.parentId).map((c) => ({ value: c.id, label: c.name }))]}
          />
          <Textarea label="Mô tả" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </form>
      </Modal>
    </>
  );
}
