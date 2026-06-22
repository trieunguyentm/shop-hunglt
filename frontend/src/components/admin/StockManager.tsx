'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  createStockReceipt,
  getAdminProducts,
  getStockReceipt,
  getStockReceipts,
  getSuppliers,
} from '@/lib/api';
import { formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { AdminProductListItem, StockReceipt, Supplier } from '@/lib/types';

interface Line {
  productId: string;
  size: string;
  color: string;
  quantity: string;
  costPrice: string;
}

const EMPTY_LINE: Line = { productId: '', size: '', color: '', quantity: '1', costPrice: '' };

export function StockManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [detail, setDetail] = useState<StockReceipt | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [r, s, p] = await Promise.all([
        getStockReceipts(token),
        getSuppliers(token),
        getAdminProducts(token),
      ]);
      setReceipts(r.data);
      setSuppliers(s.data);
      setProducts(p.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = lines.reduce(
    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.costPrice) || 0),
    0,
  );

  function reset() {
    setSupplierId('');
    setNote('');
    setLines([{ ...EMPTY_LINE }]);
    setShowForm(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    const payload = {
      supplierId,
      note: note || undefined,
      items: lines
        .filter((l) => l.productId && Number(l.quantity) > 0)
        .map((l) => ({
          productId: l.productId,
          size: l.size || null,
          color: l.color || null,
          quantity: Number(l.quantity),
          costPrice: Number(l.costPrice) || 0,
        })),
    };
    if (payload.items.length === 0) return setError('Thêm ít nhất 1 dòng hợp lệ');
    try {
      await createStockReceipt(token, payload);
      reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lập phiếu thất bại');
    }
  }

  async function openDetail(id: string) {
    if (!token) return;
    setDetail((await getStockReceipt(token, id)).data);
  }

  const inputCls = 'rounded-lg border border-line bg-ivory px-3 py-2 text-sm outline-none focus:border-ink';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-mist">{receipts.length} phiếu nhập</p>
        <Button onClick={() => (showForm ? reset() : setShowForm(true))}>
          {showForm ? 'Đóng' : '+ Lập phiếu nhập'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl2 border border-line bg-bone p-6">
          <h2 className="font-display text-xl">Phiếu nhập kho</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select className={inputCls} value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
              <option value="">— Nhà cung cấp * —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input className={inputCls} placeholder="Ghi chú" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="space-y-2">
            <p className="eyebrow">Dòng nhập (Sản phẩm · Size · Màu · SL · Đơn giá)</p>
            {lines.map((l, i) => (
              <div key={i} className="flex flex-wrap gap-2">
                <select className={`${inputCls} min-w-[180px] flex-1`} value={l.productId} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, productId: e.target.value } : x)))}>
                  <option value="">— Sản phẩm —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input className={`${inputCls} w-20`} placeholder="Size" value={l.size} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)))} />
                <input className={`${inputCls} w-24`} placeholder="Màu" value={l.color} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))} />
                <input className={`${inputCls} w-20`} type="number" placeholder="SL" value={l.quantity} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} />
                <input className={`${inputCls} w-28`} type="number" placeholder="Đơn giá" value={l.costPrice} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, costPrice: e.target.value } : x)))} />
                <button type="button" className="text-clay-dark" onClick={() => setLines(lines.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button type="button" className="link-underline text-sm text-graphite" onClick={() => setLines([...lines, { ...EMPTY_LINE }])}>+ Thêm dòng</button>
          </div>

          <p className="font-display text-lg">Tổng tiền nhập: <span className="text-clay">{formatVND(total)}</span></p>
          {error && <p className="text-sm text-clay-dark">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit">Lưu phiếu</Button>
            <Button type="button" variant="outline" onClick={reset}>Hủy</Button>
          </div>
        </form>
      )}

      {error && !showForm && <p className="text-sm text-clay-dark">{error}</p>}

      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-bone text-mist">
            <tr>
              <th className="px-4 py-3 font-medium">Mã phiếu</th>
              <th className="px-4 py-3 font-medium">Nhà cung cấp</th>
              <th className="px-4 py-3 font-medium">Số dòng</th>
              <th className="px-4 py-3 font-medium">Tổng tiền</th>
              <th className="px-4 py-3 font-medium">Người lập</th>
              <th className="px-4 py-3 font-medium">Ngày</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-mist">Đang tải...</td></tr>
            ) : receipts.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-mist">Chưa có phiếu nhập.</td></tr>
            ) : (
              receipts.map((r) => (
                <tr key={r.id} className="cursor-pointer border-t border-line hover:bg-bone" onClick={() => openDetail(r.id)}>
                  <td className="px-4 py-3 font-medium">{r.code}</td>
                  <td className="px-4 py-3">{r.supplier?.name}</td>
                  <td className="px-4 py-3">{r._count?.items ?? r.items?.length ?? 0}</td>
                  <td className="px-4 py-3">{formatVND(r.total)}</td>
                  <td className="px-4 py-3 text-mist">{r.createdBy?.username}</td>
                  <td className="px-4 py-3 text-mist">{new Date(r.receivedAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Chi tiết phiếu */}
      {detail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl2 bg-ivory p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl">{detail.code}</h3>
              <button onClick={() => setDetail(null)} className="text-mist">✕</button>
            </div>
            <p className="text-sm text-mist">NCC: {detail.supplier?.name} · {new Date(detail.receivedAt).toLocaleString('vi-VN')}</p>
            {detail.note && <p className="mt-1 text-sm italic text-graphite">{detail.note}</p>}
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {detail.items?.map((it) => (
                <li key={it.id} className="flex justify-between py-3 text-sm">
                  <span>{it.product?.name} {[it.size, it.color].filter(Boolean).join('/') && `(${[it.size, it.color].filter(Boolean).join('/')})`} × {it.quantity}</span>
                  <span>{formatVND(it.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-right font-display text-lg">Tổng: <span className="text-clay">{formatVND(detail.total)}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}
