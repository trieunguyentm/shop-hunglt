'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowUp, ExternalLink, ImagePlus, MoreHorizontal, Pencil, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';
import {
  createProductApi,
  deleteProductApi,
  getAdminProduct,
  getAdminProducts,
  getCategories,
  getSuppliers,
  updateProductApi,
} from '@/lib/api';
import { useAdminList } from '@/hooks/useAdminList';
import { useDebounce } from '@/hooks/useDebounce';
import { errorMessage, formatVND } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/images';
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUS_TONE } from '@/lib/orderStatus';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input, Textarea } from '@/components/ui/Input';
import { Menu } from '@/components/ui/Menu';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeader } from '@/components/ui/misc';
import { Select } from '@/components/ui/Select';
import { LoadingBlock } from '@/components/ui/Spinner';
import type { AdminProductListItem, Category, ProductStatus, Supplier } from '@/lib/types';

interface VariantRow {
  size: string;
  color: string;
  stock: string;
}

const EMPTY = {
  id: '',
  slug: '',
  name: '',
  sku: '',
  description: '',
  salePrice: '',
  costPrice: '',
  material: '',
  status: 'ACTIVE' as ProductStatus,
  categoryId: '',
  supplierId: '',
};

const STATUS_OPTIONS = (Object.keys(PRODUCT_STATUS_LABEL) as ProductStatus[]).map((s) => ({ value: s, label: PRODUCT_STATUS_LABEL[s] }));

/** Tách "S, M, L" → ['S','M','L'] (bỏ trùng, bỏ rỗng). */
const splitList = (s: string) => Array.from(new Set(s.split(',').map((x) => x.trim()).filter(Boolean)));

export function ProductsManager() {
  const confirm = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const search = useDebounce(searchTerm.trim());
  const [status, setStatus] = useState('');
  const list = useAdminList(getAdminProducts, { search: search || undefined, status: status || undefined });
  const token = list.token;

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [gen, setGen] = useState({ sizes: 'S, M, L, XL', colors: '', stock: '10' });
  const [open, setOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    getCategories().then((r) => setCategories(r.data)).catch(() => undefined);
    getSuppliers(token).then((r) => setSuppliers(r.data)).catch(() => undefined);
  }, [token]);

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function openCreate() {
    setForm(EMPTY);
    setImages([]);
    setVariants([]);
    setImageInput('');
    setOpen(true);
  }

  async function openEdit(id: string) {
    if (!token) return;
    setOpen(true);
    setFormLoading(true);
    try {
      const { data } = await getAdminProduct(token, id);
      setForm({
        id: data.id,
        slug: data.slug,
        name: data.name,
        sku: data.sku,
        description: data.description ?? '',
        salePrice: String(Number(data.salePrice)),
        costPrice: String(Number(data.costPrice)),
        material: data.material ?? '',
        status: data.status,
        categoryId: data.categoryId,
        supplierId: data.supplierId ?? '',
      });
      setImages(data.images.map((i) => i.url));
      setVariants(data.variants.map((v) => ({ size: v.size, color: v.color, stock: String(v.stock) })));
    } catch (e) {
      toast.error(errorMessage(e, 'Không tải được sản phẩm'));
      setOpen(false);
    } finally {
      setFormLoading(false);
    }
  }

  function addImage() {
    const url = imageInput.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast.error('URL ảnh không hợp lệ');
      return;
    }
    if (images.includes(url)) return toast.error('Ảnh này đã có trong danh sách');
    setImages([...images, url]);
    setImageInput('');
  }

  function generateVariants() {
    const sizes = splitList(gen.sizes);
    const colors = splitList(gen.colors);
    if (!sizes.length || !colors.length) return toast.error('Nhập ít nhất 1 size và 1 màu (cách nhau bằng dấu phẩy)');
    const existing = new Set(variants.map((v) => `${v.size}|${v.color}`));
    const added = sizes.flatMap((s) => colors.map((c) => ({ size: s, color: c, stock: gen.stock || '0' }))).filter((v) => !existing.has(`${v.size}|${v.color}`));
    setVariants([...variants, ...added]);
    toast.success(`Đã thêm ${added.length} biến thể`);
  }

  const totalStock = variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  const margin = Number(form.salePrice) - Number(form.costPrice);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const clean = variants.filter((v) => v.size.trim() && v.color.trim());
    const keys = clean.map((v) => `${v.size.trim()}|${v.color.trim()}`);
    if (new Set(keys).size !== keys.length) return toast.error('Có biến thể trùng Size + Màu');
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      description: form.description.trim() || undefined,
      salePrice: Number(form.salePrice),
      costPrice: Number(form.costPrice),
      material: form.material.trim() || undefined,
      status: form.status,
      categoryId: form.categoryId,
      supplierId: form.supplierId || null,
      images: images.map((url, i) => ({ url, isPrimary: i === 0, sortOrder: i })),
      variants: clean.map((v) => ({ size: v.size.trim(), color: v.color.trim(), stock: Math.max(0, Number(v.stock) || 0) })),
    };
    setSaving(true);
    try {
      if (form.id) await updateProductApi(token, form.id, payload);
      else await createProductApi(token, payload);
      toast.success(form.id ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm');
      setOpen(false);
      await list.reload();
    } catch (err) {
      toast.error(errorMessage(err, 'Lưu thất bại'));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(p: AdminProductListItem) {
    if (!token) return;
    const ok = await confirm({
      title: `Xóa “${p.name}”?`,
      description: 'Nếu sản phẩm đã có trong đơn hàng, hệ thống sẽ chuyển sang trạng thái Ẩn thay vì xóa hẳn.',
      confirmText: 'Xóa',
      danger: true,
    });
    if (!ok) return;
    try {
      const r = await deleteProductApi(token, p.id);
      toast.success((r.data as { hidden?: boolean }).hidden ? 'Sản phẩm đã có đơn hàng/phiếu nhập — đã chuyển sang Ẩn để giữ lịch sử' : 'Đã xóa sản phẩm');
      await list.reload();
    } catch (e) {
      toast.error(errorMessage(e, 'Xóa thất bại'));
    }
  }

  const columns: Column<AdminProductListItem>[] = [
    {
      key: 'name',
      header: 'Sản phẩm',
      className: 'min-w-[220px]',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image src={p.images[0]?.url ?? PLACEHOLDER_IMAGE} alt="" fill sizes="40px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="line-clamp-1 font-semibold">{p.name}</p>
            <p className="whitespace-nowrap text-xs text-ink-3">{p.sku}</p>
          </div>
        </div>
      ),
    },
    { key: 'cat', header: 'Danh mục', hideOnMobile: true, cell: (p) => <span className="text-ink-2">{p.category?.name ?? '—'}</span> },
    { key: 'price', header: 'Giá bán', align: 'right', cell: (p) => <span className="whitespace-nowrap font-semibold">{formatVND(p.salePrice)}</span> },
    {
      key: 'stock',
      header: 'Tồn kho',
      align: 'right',
      cell: (p) => <span className={p.stock <= 0 ? 'font-bold text-danger' : p.stock < 10 ? 'font-bold text-warning' : 'font-semibold'}>{p.stock}</span>,
    },
    { key: 'status', header: 'Trạng thái', hideOnMobile: true, cell: (p) => <Badge tone={PRODUCT_STATUS_TONE[p.status]} dot>{PRODUCT_STATUS_LABEL[p.status]}</Badge> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (p) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Menu
            width={200}
            items={[
              { label: 'Chỉnh sửa', icon: <Pencil size={15} />, onSelect: () => openEdit(p.id) },
              { label: 'Xem trên cửa hàng', icon: <ExternalLink size={15} />, href: `/products/${p.slug}` },
              { type: 'separator' },
              { label: 'Xóa', icon: <Trash2 size={15} />, danger: true, onSelect: () => onDelete(p) },
            ]}
            trigger={(t) => (
              <button {...t} aria-label={`Thao tác cho ${p.name}`} className="grid h-9 w-9 place-items-center rounded-full text-ink-3 hover:bg-muted hover:text-ink">
                <MoreHorizontal size={18} />
              </button>
            )}
          />
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Sản phẩm" description={`${list.total} sản phẩm trong hệ thống`} actions={<Button leftIcon={<Plus size={17} />} onClick={openCreate}>Thêm sản phẩm</Button>} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input wrapperClassName="flex-1" placeholder="Tìm theo tên hoặc SKU..." leftIcon={<Search size={16} />} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} aria-label="Tìm sản phẩm" />
        <Select wrapperClassName="sm:w-52" aria-label="Lọc trạng thái" value={status} onChange={setStatus} options={[{ value: '', label: 'Mọi trạng thái' }, ...STATUS_OPTIONS]} />
      </div>

      {list.error && <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{list.error}</p>}

      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(p) => p.id}
        loading={list.loading}
        onRowClick={(p) => openEdit(p.id)}
        emptyTitle={search || status ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm'}
        emptyDescription={search || status ? 'Thử từ khóa khác hoặc bỏ bộ lọc.' : 'Bấm “Thêm sản phẩm” để bắt đầu.'}
        footer={list.totalPages > 1 ? <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} /> : undefined}
      />

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        variant="right"
        size="lg"
        title={form.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}
        description={form.id ? form.sku : 'SKU và đường dẫn sẽ tự sinh nếu để trống'}
        dismissible={!saving}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Hủy</Button>
            <Button type="submit" form="product-form" loading={saving} disabled={formLoading}>{form.id ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</Button>
          </>
        }
      >
        {formLoading ? (
          <LoadingBlock />
        ) : (
          <form id="product-form" onSubmit={onSubmit} className="space-y-8">
            <section className="space-y-4">
              <h3 className="font-bold">Thông tin cơ bản</h3>
              <Input label="Tên sản phẩm" required maxLength={200} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Áo thun cotton oversize" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Danh mục" required value={form.categoryId} onChange={(v) => set('categoryId', v)} placeholder="Chọn danh mục" options={categories.map((c) => ({ value: c.id, label: c.name }))} />
                <Select label="Nhà cung cấp" value={form.supplierId} onChange={(v) => set('supplierId', v)} options={[{ value: '', label: '— Không chọn —' }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]} />
                <Input label="SKU" hint="Để trống để tự sinh" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
                <Input label="Chất liệu" value={form.material} onChange={(e) => set('material', e.target.value)} placeholder="Cotton 100%" />
              </div>
              <Textarea label="Mô tả" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
              <Select label="Trạng thái" value={form.status} onChange={(v) => set('status', v as ProductStatus)} options={STATUS_OPTIONS} />
            </section>

            <section className="space-y-4">
              <h3 className="font-bold">Giá</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Giá bán (đ)" required type="number" min={0} step={1000} value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} />
                <Input label="Giá nhập (đ)" required type="number" min={0} step={1000} value={form.costPrice} onChange={(e) => set('costPrice', e.target.value)} />
              </div>
              {form.salePrice && form.costPrice && (
                <p className={margin < 0 ? 'text-sm font-semibold text-danger' : 'text-sm text-ink-3'}>
                  {margin < 0 ? '⚠ Giá bán đang thấp hơn giá nhập' : `Lãi gộp: ${formatVND(margin)} / sản phẩm`}
                </p>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-baseline justify-between">
                <h3 className="font-bold">Biến thể (Size × Màu)</h3>
                <span className="text-sm text-ink-3">Tổng tồn: <b className="text-ink">{totalStock}</b></span>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Sparkles size={15} /> Tạo nhanh</p>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_90px_auto]">
                  <Input size="sm" placeholder="Size: S, M, L" value={gen.sizes} onChange={(e) => setGen({ ...gen, sizes: e.target.value })} aria-label="Danh sách size" />
                  <Input size="sm" placeholder="Màu: Đen, Trắng" value={gen.colors} onChange={(e) => setGen({ ...gen, colors: e.target.value })} aria-label="Danh sách màu" />
                  <Input size="sm" type="number" min={0} placeholder="Tồn" value={gen.stock} onChange={(e) => setGen({ ...gen, stock: e.target.value })} aria-label="Tồn mỗi biến thể" />
                  <Button size="sm" variant="primary" onClick={generateVariants}>Tạo</Button>
                </div>
              </div>
              {variants.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-line">
                  <div className="grid grid-cols-[1fr_1fr_90px_40px] gap-2 bg-canvas px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink-3">
                    <span>Size</span><span>Màu</span><span>Tồn</span><span />
                  </div>
                  <ul className="max-h-72 divide-y divide-line overflow-y-auto">
                    {variants.map((v, i) => (
                      <li key={i} className="grid grid-cols-[1fr_1fr_90px_40px] items-center gap-2 px-3 py-2">
                        <Input size="sm" value={v.size} aria-label="Size" onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)))} />
                        <Input size="sm" value={v.color} aria-label="Màu" onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))} />
                        <Input size="sm" type="number" min={0} value={v.stock} aria-label="Tồn" onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)))} />
                        <button type="button" aria-label="Xóa biến thể" onClick={() => setVariants(variants.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-full text-ink-3 hover:bg-danger-soft hover:text-danger">
                          <X size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-ink-3">Chưa có biến thể. Sản phẩm không có biến thể sẽ dùng tồn kho tổng (cập nhật qua Nhập kho).</p>
              )}
              <Button size="sm" variant="ghost" leftIcon={<Plus size={15} />} onClick={() => setVariants([...variants, { size: '', color: '', stock: '0' }])}>
                Thêm 1 dòng
              </Button>
            </section>

            <section className="space-y-4">
              <h3 className="font-bold">Hình ảnh <span className="font-normal text-ink-3">— ảnh đầu tiên là ảnh chính</span></h3>
              <div className="flex gap-2">
                <Input wrapperClassName="flex-1" type="url" placeholder="Dán URL ảnh (https://...)" value={imageInput} onChange={(e) => setImageInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }} aria-label="URL ảnh" />
                <Button variant="outline" leftIcon={<ImagePlus size={16} />} onClick={addImage}>Thêm</Button>
              </div>
              {images.length > 0 && (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((url, i) => (
                    <li key={url} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element -- xem trước URL bất kỳ, không qua next/image domain whitelist */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      {i === 0 && <span className="absolute left-1.5 top-1.5"><Badge tone="lime">Ảnh chính</Badge></span>}
                      <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        {i > 0 && (
                          <button type="button" aria-label="Đặt làm ảnh chính" title="Đặt làm ảnh chính" onClick={() => setImages([url, ...images.filter((u) => u !== url)])} className="grid h-8 w-8 place-items-center rounded-full bg-surface shadow-soft hover:bg-lime-400">
                            <ArrowUp size={14} />
                          </button>
                        )}
                        <button type="button" aria-label="Xóa ảnh" onClick={() => setImages(images.filter((u) => u !== url))} className="grid h-8 w-8 place-items-center rounded-full bg-surface text-danger shadow-soft hover:bg-danger-soft">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </form>
        )}
      </Modal>
    </>
  );
}
