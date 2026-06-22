'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  createSupplier,
  deleteSupplierApi,
  getSuppliers,
  updateSupplierApi,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import type { Supplier } from '@/lib/types';

const EMPTY = { id: '', name: '', contactPerson: '', phone: '', email: '', address: '', taxCode: '' };

export function SuppliersManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [items, setItems] = useState<Supplier[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setItems((await getSuppliers(token)).data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải nhà cung cấp');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    try {
      const { id, ...rest } = form;
      if (id) await updateSupplierApi(token, id, rest);
      else await createSupplier(token, rest);
      setForm(EMPTY);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  }

  async function onDelete(id: string) {
    if (!token) return;
    try {
      await deleteSupplierApi(token, id);
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
        <h2 className="mb-4 font-display text-xl">{form.id ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className={inputCls} placeholder="Tên NCC" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={inputCls} placeholder="Người liên hệ" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          <input className={inputCls} placeholder="Điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className={inputCls} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={inputCls} placeholder="Mã số thuế" value={form.taxCode} onChange={(e) => setForm({ ...form, taxCode: e.target.value })} />
          <input className={inputCls} placeholder="Địa chỉ" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button type="submit">{form.id ? 'Cập nhật' : 'Thêm'}</Button>
          {form.id && <Button type="button" variant="outline" onClick={() => setForm(EMPTY)}>Hủy</Button>}
        </div>
      </form>

      {error && <p className="text-sm text-clay-dark">{error}</p>}

      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-bone text-mist">
            <tr>
              <th className="px-4 py-3 font-medium">Tên</th>
              <th className="px-4 py-3 font-medium">Liên hệ</th>
              <th className="px-4 py-3 font-medium">Điện thoại</th>
              <th className="px-4 py-3 font-medium">Số SP</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-mist">Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-mist">Chưa có nhà cung cấp.</td></tr>
            ) : (
              items.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3">{s.contactPerson ?? '—'}</td>
                  <td className="px-4 py-3">{s.phone ?? '—'}</td>
                  <td className="px-4 py-3">{s._count?.products ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button className="link-underline text-graphite hover:text-ink" onClick={() => setForm({ id: s.id, name: s.name, contactPerson: s.contactPerson ?? '', phone: s.phone ?? '', email: s.email ?? '', address: s.address ?? '', taxCode: s.taxCode ?? '' })}>Sửa</button>
                      <button className="link-underline text-clay-dark" onClick={() => onDelete(s.id)}>Xóa</button>
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
