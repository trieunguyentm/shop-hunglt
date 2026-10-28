'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PackagePlus, Plus, X } from 'lucide-react';
import { createStockReceipt, getAdminProduct, getAdminProducts, getStockReceipt, getStockReceipts, getSuppliers } from '@/lib/api';
import { useAdminList } from '@/hooks/useAdminList';
import { errorMessage, formatDateTime, formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Card, DescriptionList, PageHeader } from '@/components/ui/misc';
import { Select } from '@/components/ui/Select';
import { LoadingBlock } from '@/components/ui/Spinner';
import type { AdminProductDetail, AdminProductListItem, StockReceipt, Supplier } from '@/lib/types';

interface Line {
  key: number;
  productId: string;
  /** "size|color" hoặc "" (không theo biến thể) */
  variant: string;
  quantity: string;
  costPrice: string;
}

let lineSeq = 0;
const newLine = (): Line => ({ key: ++lineSeq, productId: '', variant: '', quantity: '1', costPrice: '' });

export function StockManager() {
  const list = useAdminList(getStockReceipts, {});
  const token = list.token;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const details = useRef(new Map<string, AdminProductDetail>());
  const [, force] = useState(0);

  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<StockReceipt | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!token || !open) return;
    getSuppliers(token).then((r) => setSuppliers(r.data)).catch(() => undefined);
    // pageSize tối đa của API là 100 — đủ cho danh sách chọn
    getAdminProducts(token, { pageSize: 100 }).then((r) => setProducts(r.data)).catch(() => undefined);
  }, [token, open]);

  const updateLine = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  async function pickProduct(key: number, productId: string) {
    updateLine(key, { productId, variant: '' });
    if (!token || !productId) return;
    let d = details.current.get(productId);
    if (!d) {
      try {
        d = (await getAdminProduct(token, productId)).data;
        details.current.set(productId, d);
        force((n) => n + 1);
      } catch {
        return;
      }
    }
    // Gợi ý đơn giá = giá nhập hiện tại, biến thể đầu tiên
    const first = d.variants[0];
    updateLine(key, { costPrice: String(Number(d.costPrice)), variant: first ? `${first.size}|${first.color}` : '' });
  }

  const total = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.costPrice) || 0), 0);

  function reset() {
    setSupplierId('');
    setNote('');
    setLines([newLine()]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const items = lines
      .filter((l) => l.productId && Number(l.quantity) > 0)
      .map((l) => {
        const [size, color] = l.variant ? l.variant.split('|') : [null, null];
        return { productId: l.productId, size, color, quantity: Number(l.quantity), costPrice: Number(l.costPrice) || 0 };
      });
    if (!items.length) return toast.error('Thêm ít nhất 1 dòng hợp lệ (chọn sản phẩm và số lượng > 0)');
    setSaving(true);
    try {
      const r = await createStockReceipt(token, { supplierId, note: note.trim() || undefined, items });
      toast.success(`Đã lập phiếu ${r.data.code} — tồn kho đã được cộng`);
      details.current.clear();
      reset();
      setOpen(false);
      await list.reload();
    } catch (err) {
      toast.error(errorMessage(err, 'Lập phiếu thất bại'));
    } finally {
      setSaving(false);
    }
  }

  async function openDetail(r: StockReceipt) {
    if (!token) return;
    setDetail(r);
    setDetailLoading(true);
    try {
      setDetail((await getStockReceipt(token, r.id)).data);
    } catch (e) {
      toast.error(errorMessage(e, 'Không tải được phiếu'));
    } finally {
      setDetailLoading(false);
    }
  }

  const columns: Column<StockReceipt>[] = [
    { key: 'code', header: 'Mã phiếu', cell: (r) => <span className="font-bold">{r.code}</span> },
    { key: 'supplier', header: 'Nhà cung cấp', cell: (r) => r.supplier?.name ?? '—' },
    { key: 'lines', header: 'Số dòng', align: 'right', hideOnMobile: true, cell: (r) => r._count?.items ?? r.items?.length ?? 0 },
    { key: 'total', header: 'Tổng tiền', align: 'right', cell: (r) => <span className="font-semibold">{formatVND(r.total)}</span> },
    { key: 'by', header: 'Người lập', hideOnMobile: true, cell: (r) => <span className="text-ink-3">{r.createdBy?.username ?? '—'}</span> },
    { key: 'date', header: 'Thời gian', hideOnMobile: true, cell: (r) => <span className="whitespace-nowrap text-ink-3">{formatDateTime(r.receivedAt)}</span> },
  ];

  return (
    <>
      <PageHeader title="Nhập kho" description={`${list.total} phiếu nhập`} actions={<Button leftIcon={<PackagePlus size={17} />} onClick={() => setOpen(true)}>Lập phiếu nhập</Button>} />
      {list.error && <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{list.error}</p>}
      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(r) => r.id}
        loading={list.loading}
        onRowClick={openDetail}
        emptyTitle="Chưa có phiếu nhập"
        emptyDescription="Lập phiếu khi nhận hàng từ nhà cung cấp để cộng tồn kho."
        footer={list.totalPages > 1 ? <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} /> : undefined}
      />

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        variant="right"
        size="xl"
        title="Lập phiếu nhập kho"
        description="Tồn kho sản phẩm & biến thể được cộng ngay khi lưu"
        dismissible={!saving}
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <p className="text-sm">
              Tổng: <b className="text-lg">{formatVND(total)}</b>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Hủy</Button>
              <Button type="submit" form="stock-form" loading={saving}>Lưu phiếu</Button>
            </div>
          </div>
        }
      >
        <form id="stock-form" onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Nhà cung cấp" required value={supplierId} onChange={setSupplierId} placeholder="Chọn nhà cung cấp" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
            <Input label="Ghi chú" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Đợt hàng tháng 10..." />
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">Hàng nhập</p>
            <ul className="space-y-3">
              {lines.map((l, idx) => {
                const d = l.productId ? details.current.get(l.productId) : undefined;
                return (
                  <li key={l.key} className="rounded-2xl border border-line bg-canvas p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink-3">Dòng {idx + 1}</span>
                      {lines.length > 1 && (
                        <button type="button" aria-label="Xóa dòng" onClick={() => setLines(lines.filter((x) => x.key !== l.key))} className="grid h-7 w-7 place-items-center rounded-full text-ink-3 hover:bg-danger-soft hover:text-danger">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[2fr_1.4fr_80px_120px]">
                      <Select size="sm" aria-label="Sản phẩm" searchable value={l.productId} onChange={(v) => pickProduct(l.key, v)} placeholder="Chọn sản phẩm" options={products.map((p) => ({ value: p.id, label: p.name, description: `${p.sku} · tồn ${p.stock}` }))} />
                      <Select
                        size="sm"
                        aria-label="Biến thể"
                        value={l.variant}
                        onChange={(v) => updateLine(l.key, { variant: v })}
                        disabled={!l.productId || !d}
                        placeholder={l.productId && !d ? 'Đang tải...' : 'Biến thể'}
                        options={d?.variants.length ? d.variants.map((v) => ({ value: `${v.size}|${v.color}`, label: `${v.size} · ${v.color}`, description: `Tồn ${v.stock}` })) : [{ value: '', label: 'Không theo biến thể' }]}
                      />
                      <Input size="sm" type="number" min={1} aria-label="Số lượng" placeholder="SL" value={l.quantity} onChange={(e) => updateLine(l.key, { quantity: e.target.value })} />
                      <Input size="sm" type="number" min={0} step={1000} aria-label="Đơn giá nhập" placeholder="Đơn giá" value={l.costPrice} onChange={(e) => updateLine(l.key, { costPrice: e.target.value })} />
                    </div>
                  </li>
                );
              })}
            </ul>
            <Button size="sm" variant="ghost" className="mt-2" leftIcon={<Plus size={15} />} onClick={() => setLines([...lines, newLine()])}>
              Thêm dòng
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} size="lg" title={detail ? `Phiếu ${detail.code}` : ''} description={detail ? formatDateTime(detail.receivedAt) : undefined}>
        {detail && (
          <div className="space-y-5">
            <DescriptionList
              items={[
                { label: 'Nhà cung cấp', value: detail.supplier?.name ?? '—' },
                { label: 'Người lập', value: detail.createdBy?.username ?? '—' },
                ...(detail.note ? [{ label: 'Ghi chú', value: detail.note }] : []),
              ]}
            />
            <Card className="p-4">
              {detailLoading ? (
                <LoadingBlock className="py-6" />
              ) : (
                <ul className="divide-y divide-line">
                  {detail.items?.map((it) => (
                    <li key={it.id} className="flex justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                      <span>
                        <span className="font-semibold">{it.product?.name}</span>
                        <span className="block text-xs text-ink-3">
                          {[it.size, it.color].filter(Boolean).join(' · ') || 'Không theo biến thể'} · {formatVND(it.costPrice)} × {it.quantity}
                        </span>
                      </span>
                      <span className="font-semibold">{formatVND(it.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <p className="text-right text-lg">
              Tổng: <b>{formatVND(detail.total)}</b>
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
