'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  createCategory,
  deleteCategoryApi,
  getCategories,
  updateCategoryApi,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import type { Category } from '@/lib/types';

const EMPTY = { id: '', name: '', description: '', parentId: '' };

export function CategoriesManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await getCategories()).data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        parentId: form.parentId || null,
      };
      if (form.id) await updateCategoryApi(token, form.id, payload);
      else await createCategory(token, payload);
      setForm(EMPTY);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  }

  async function onDelete(id: string) {
    if (!token) return;
    try {
      await deleteCategoryApi(token, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xóa thất bại');
    }
  }

  const inputCls =
    'rounded-lg border border-line bg-ivory px-3 py-2 text-sm outline-none focus:border-ink';

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="rounded-xl2 border border-line bg-bone p-6">
        <h2 className="mb-4 font-display text-xl">{form.id ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className={inputCls} placeholder="Tên danh mục" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={inputCls} placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className={inputCls} value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
            <option value="">— Danh mục gốc —</option>
            {items.filter((c) => c.id !== form.id).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button type="submit">{form.id ? 'Cập nhật' : 'Thêm'}</Button>
            {form.id && (
              <Button type="button" variant="outline" onClick={() => setForm(EMPTY)}>Hủy</Button>
            )}
          </div>
        </div>
      </form>

      {error && <p className="text-sm text-clay-dark">{error}</p>}

      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-bone text-mist">
            <tr>
              <th className="px-4 py-3 font-medium">Tên</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Số SP</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-mist">Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-mist">Chưa có danh mục.</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3 text-mist">{c.slug}</td>
                  <td className="px-4 py-3">{c._count?.products ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button className="link-underline text-graphite hover:text-ink" onClick={() => setForm({ id: c.id, name: c.name, description: c.description ?? '', parentId: c.parentId ?? '' })}>Sửa</button>
                      <button className="link-underline text-clay-dark" onClick={() => onDelete(c.id)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
