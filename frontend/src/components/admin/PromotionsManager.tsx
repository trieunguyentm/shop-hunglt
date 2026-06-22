'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  createPromotion,
  deletePromotionApi,
  getPromotions,
  updatePromotionApi,
} from '@/lib/api';
import { formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { Promotion } from '@/lib/types';

const EMPTY = {
  id: '',
  name: '',
  code: '',
  discountType: 'PERCENT',
  discountValue: '',
  minOrderTotal: '0',
  startDate: '',
  endDate: '',
  quantityLeft: '0',
  isActive: true,
};

export function PromotionsManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [items, setItems] = useState<Promotion[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setItems((await getPromotions(token)).data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải khuyến mãi');
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
    const payload = {
      name: form.name,
      code: form.code,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderTotal: Number(form.minOrderTotal),
      quantityLeft: Number(form.quantityLeft),
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: form.isActive,
    };
    try {
      if (form.id) await updatePromotionApi(token, form.id, payload);
      else await createPromotion(token, payload);
      setForm(EMPTY);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  }

  async function onDelete(id: string) {
    if (!token) return;
    try {
      await deletePromotionApi(token, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xóa thất bại');
    }
  }

  const inputCls =
    'rounded-lg border border-line bg-ivory px-3 py-2 text-sm outline-none focus:border-ink';
  const fmtDate = (iso: string) => iso.slice(0, 10);

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="rounded-xl2 border border-line bg-bone p-6">
        <h2 className="mb-4 font-display text-xl">{form.id ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi'}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className={inputCls} placeholder="Tên chương trình" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={inputCls} placeholder="Mã (vd SALE20)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
          <select className={inputCls} value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
            <option value="PERCENT">Giảm theo %</option>
            <option value="FIXED">Giảm số tiền</option>
          </select>
          <input className={inputCls} type="number" placeholder={form.discountType === 'PERCENT' ? 'Số %' : 'Số tiền'} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required />
          <input className={inputCls} type="number" placeholder="Đơn tối thiểu" value={form.minOrderTotal} onChange={(e) => setForm({ ...form, minOrderTotal: e.target.value })} />
          <input className={inputCls} type="number" placeholder="Số lượt" value={form.quantityLeft} onChange={(e) => setForm({ ...form, quantityLeft: e.target.value })} />
          <input className={inputCls} type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          <input className={inputCls} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Đang áp dụng
        </label>
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
              <th className="px-4 py-3 font-medium">Mã</th>
              <th className="px-4 py-3 font-medium">Giảm</th>
              <th className="px-4 py-3 font-medium">Tối thiểu</th>
              <th className="px-4 py-3 font-medium">Lượt</th>
              <th className="px-4 py-3 font-medium">Hiệu lực</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-mist">Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-mist">Chưa có khuyến mãi.</td></tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{p.code}{!p.isActive && <span className="ml-2 text-xs text-mist">(tắt)</span>}</td>
                  <td className="px-4 py-3">{p.discountType === 'PERCENT' ? `${Number(p.discountValue)}%` : formatVND(p.discountValue)}</td>
                  <td className="px-4 py-3">{formatVND(p.minOrderTotal)}</td>
                  <td className="px-4 py-3">{p.quantityLeft}</td>
                  <td className="px-4 py-3 text-mist">{fmtDate(p.startDate)} → {fmtDate(p.endDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button className="link-underline text-graphite hover:text-ink" onClick={() => setForm({ id: p.id, name: p.name, code: p.code, discountType: p.discountType, discountValue: String(Number(p.discountValue)), minOrderTotal: String(Number(p.minOrderTotal)), quantityLeft: String(p.quantityLeft), startDate: fmtDate(p.startDate), endDate: fmtDate(p.endDate), isActive: p.isActive })}>Sửa</button>
                      <button className="link-underline text-clay-dark" onClick={() => onDelete(p.id)}>Xóa</button>
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
