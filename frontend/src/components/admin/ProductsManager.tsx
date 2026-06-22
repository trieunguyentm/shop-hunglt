'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  createProductApi,
  deleteProductApi,
  getAdminProduct,
  getAdminProducts,
  getCategories,
  getSuppliers,
  updateProductApi,
} from '@/lib/api';
import { formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { AdminProductListItem, Category, Supplier } from '@/lib/types';

interface VariantRow {
  size: string;
  color: string;
  stock: string;
}

const EMPTY = {
  id: '',
  name: '',
  sku: '',
  description: '',
  salePrice: '',
  costPrice: '',
  material: '',
  status: 'ACTIVE',
  categoryId: '',
  supplierId: '',
};

export function ProductsManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [items, setItems] = useState<AdminProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState<string[]>(['']);
  const [variants, setVariants] = useState<VariantRow[]>([{ size: '', color: '', stock: '0' }]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [p, c, s] = await Promise.all([
        getAdminProducts(token),
        getCategories(),
        getSuppliers(token),
      ]);
      setItems(p.data);
      setCategories(c.data);
      setSuppliers(s.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setForm(EMPTY);
    setImages(['']);
    setVariants([{ size: '', color: '', stock: '0' }]);
    setShowForm(false);
  }

  async function startEdit(id: string) {
    if (!token) return;
    setError('');
    try {
      const { data } = await getAdminProduct(token, id);
      setForm({
        id: data.id,
        name: data.name,
        sku: data.sku,
        description: data.description ?? '',
        salePrice: String(data.salePrice),
        costPrice: String(data.costPrice),
        material: data.material ?? '',
        status: data.status,
        categoryId: data.categoryId,
        supplierId: data.supplierId ?? '',
      });
      setImages(data.images.length ? data.images.map((i) => i.url) : ['']);
      setVariants(
        data.variants.length
          ? data.variants.map((v) => ({ size: v.size, color: v.color, stock: String(v.stock) }))
          : [{ size: '', color: '', stock: '0' }],
      );
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được sản phẩm');
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    const payload = {
      name: form.name,
      sku: form.sku || undefined,
      description: form.description || undefined,
      salePrice: Number(form.salePrice),
      costPrice: Number(form.costPrice),
      material: form.material || undefined,
      status: form.status,
      categoryId: form.categoryId,
      supplierId: form.supplierId || null,
      images: images
        .filter((u) => u.trim())
        .map((url, i) => ({ url: url.trim(), isPrimary: i === 0, sortOrder: i })),
      variants: variants
        .filter((v) => v.size.trim() && v.color.trim())
        .map((v) => ({ size: v.size.trim(), color: v.color.trim(), stock: Number(v.stock) || 0 })),
    };
    try {
      if (form.id) await updateProductApi(token, form.id, payload);
      else await createProductApi(token, payload);
      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  }

  async function onDelete(id: string) {
    if (!token) return;
    try {
      await deleteProductApi(token, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xóa thất bại');
    }
  }

  const inputCls =
    'rounded-lg border border-line bg-ivory px-3 py-2 text-sm outline-none focus:border-ink';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-mist">{items.length} sản phẩm</p>
        <Button onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? 'Đóng form' : '+ Thêm sản phẩm'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="space-y-5 rounded-xl2 border border-line bg-bone p-6">
          <h2 className="font-display text-xl">{form.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input className={inputCls} placeholder="Tên sản phẩm *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className={inputCls} placeholder="SKU (tự sinh nếu trống)" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <input className={inputCls} placeholder="Chất liệu" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
            <input className={inputCls} type="number" placeholder="Giá bán *" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} required />
            <input className={inputCls} type="number" placeholder="Giá nhập *" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} required />
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Đang bán</option>
              <option value="HIDDEN">Ẩn</option>
              <option value="OUT_OF_STOCK">Hết hàng</option>
            </select>
            <select className={inputCls} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
              <option value="">— Danh mục * —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className={inputCls} value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">— Nhà cung cấp —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <textarea className={`${inputCls} w-full`} rows={3} placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          {/* Ảnh */}
          <div>
            <p className="eyebrow mb-2">Ảnh (URL) — ảnh đầu là ảnh chính</p>
            <div className="space-y-2">
              {images.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${inputCls} flex-1`} placeholder="https://..." value={url} onChange={(e) => setImages(images.map((u, j) => (j === i ? e.target.value : u)))} />
                  <button type="button" className="text-clay-dark" onClick={() => setImages(images.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
            </div>
            <button type="button" className="link-underline mt-2 text-sm text-graphite" onClick={() => setImages([...images, ''])}>+ Thêm ảnh</button>
          </div>

          {/* Biến thể */}
          <div>
            <p className="eyebrow mb-2">Biến thể (Size · Màu · Tồn) — tồn kho tổng = tổng biến thể</p>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <input className={`${inputCls} w-24`} placeholder="Size" value={v.size} onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)))} />
                  <input className={`${inputCls} flex-1`} placeholder="Màu" value={v.color} onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))} />
                  <input className={`${inputCls} w-24`} type="number" placeholder="Tồn" value={v.stock} onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)))} />
                  <button type="button" className="text-clay-dark" onClick={() => setVariants(variants.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
            </div>
            <button type="button" className="link-underline mt-2 text-sm text-graphite" onClick={() => setVariants([...variants, { size: '', color: '', stock: '0' }])}>+ Thêm biến thể</button>
          </div>

          {error && <p className="text-sm text-clay-dark">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit">{form.id ? 'Cập nhật' : 'Tạo sản phẩm'}</Button>
            <Button type="button" variant="outline" onClick={resetForm}>Hủy</Button>
          </div>
        </form>
      )}

      {error && !showForm && <p className="text-sm text-clay-dark">{error}</p>}

      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-bone text-mist">
            <tr>
              <th className="px-4 py-3 font-medium">Tên</th>
              <th className="px-4 py-3 font-medium">Danh mục</th>
              <th className="px-4 py-3 font-medium">Giá</th>
              <th className="px-4 py-3 font-medium">Tồn</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-mist">Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-mist">Chưa có sản phẩm.</td></tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3 text-mist">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-3">{formatVND(p.salePrice)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">{p.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button className="link-underline text-graphite hover:text-ink" onClick={() => startEdit(p.id)}>Sửa</button>
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
