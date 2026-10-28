'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, ShoppingBag, Trash2, WifiOff } from 'lucide-react';
import { getCart, removeCartItem, updateCartItem } from '@/lib/api';
import { useAccessToken } from '@/hooks/useAccessToken';
import { useCartStore } from '@/lib/stores/cart';
import { errorMessage, formatVND } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/images';
import { SHIPPING_FEE } from '@/lib/orderStatus';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, QuantityStepper } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Cart } from '@/lib/types';

export default function CartPage() {
  const { token, ready } = useAccessToken();
  const setCartStore = useCartStore((s) => s.setCart);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const apply = useCallback(
    (c: Cart) => {
      setCart(c);
      setCartStore(c);
    },
    [setCartStore],
  );

  const refresh = useCallback(async () => {
    // Chưa có token → SessionGuard lo điều hướng; không kẹt trạng thái tải
    if (!token) {
      if (ready) setLoading(false);
      return;
    }
    setLoading(true);
    try {
      apply((await getCart(token)).data);
      setError('');
    } catch (e) {
      setError(errorMessage(e, 'Không tải được giỏ hàng'));
    } finally {
      setLoading(false);
    }
  }, [token, ready, apply]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function changeQty(id: string, qty: number) {
    if (!token || qty < 1) return;
    setBusyId(id);
    try {
      apply((await updateCartItem(token, id, qty)).data);
    } catch (e) {
      toast.error(errorMessage(e, 'Không cập nhật được số lượng'));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!token) return;
    setBusyId(id);
    try {
      apply((await removeCartItem(token, id)).data);
      toast.success(`Đã xóa “${name}” khỏi giỏ`);
    } catch (e) {
      toast.error(errorMessage(e, 'Xóa thất bại'));
    } finally {
      setBusyId(null);
    }
  }

  const items = cart?.items ?? [];
  const overStock = items.some((it) => it.available !== undefined && it.quantity > it.available);

  return (
    <div className="container-page page-top">
      <h1 className="heading-1 mb-8">
        Giỏ hàng {items.length > 0 && <span className="text-ink-3">({cart?.count})</span>}
      </h1>

      {loading ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 rounded-3xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      ) : error ? (
        <EmptyState tone="danger" icon={<WifiOff size={24} />} title="Không tải được giỏ hàng" description={error} action={<Button onClick={refresh}>Thử lại</Button>} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={24} />}
          title="Giỏ hàng đang trống"
          description="Thêm vài món bạn thích rồi quay lại đây nhé."
          action={<ButtonLink href="/products" rightIcon={<ArrowRight size={16} />}>Tiếp tục mua sắm</ButtonLink>}
        />
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <ul className="space-y-3">
            {items.map((it) => {
              const outOfStock = it.available !== undefined && it.quantity > it.available;
              return (
                <li key={it.id} className="flex gap-4 rounded-3xl border border-line bg-surface p-3 sm:p-4">
                  <Link href={`/products/${it.product.slug}`} className="relative h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-36 sm:w-28">
                    <Image src={it.product.images[0]?.url ?? PLACEHOLDER_IMAGE} alt={it.product.name} fill sizes="112px" className="object-cover" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/products/${it.product.slug}`} className="line-clamp-2 font-semibold hover:text-brand-600">
                          {it.product.name}
                        </Link>
                        <p className="mt-1 text-sm text-ink-3">{[it.size, it.color].filter(Boolean).join(' · ') || 'Mặc định'}</p>
                      </div>
                      <button
                        aria-label={`Xóa ${it.product.name}`}
                        disabled={busyId === it.id}
                        onClick={() => remove(it.id, it.product.name)}
                        className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-40"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                    {outOfStock && (
                      <p className="mt-2 text-xs font-semibold text-danger">
                        {it.available ? `Chỉ còn ${it.available} sản phẩm — vui lòng giảm số lượng` : 'Phân loại này đã hết hàng'}
                      </p>
                    )}
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                      <QuantityStepper
                        size="sm"
                        value={it.quantity}
                        min={1}
                        max={Math.max(it.quantity, it.available ?? 99)}
                        busy={busyId === it.id}
                        onChange={(v) => changeQty(it.id, v)}
                      />
                      <div className="text-right">
                        <p className="font-bold">{formatVND(Number(it.product.salePrice) * it.quantity)}</p>
                        {it.quantity > 1 && <p className="text-xs text-ink-3">{formatVND(it.product.salePrice)} / sp</p>}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <Card as="aside" className="lg:sticky lg:top-[calc(var(--header-h)+24px)]">
            <h2 className="text-lg font-bold">Tóm tắt đơn hàng</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-3">Tạm tính ({cart?.count} sản phẩm)</dt>
                <dd className="font-semibold">{formatVND(cart?.subtotal ?? 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-3">Phí vận chuyển</dt>
                <dd className="font-semibold">{formatVND(SHIPPING_FEE)}</dd>
              </div>
            </dl>
            <div className="my-5 h-px bg-line" />
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Tổng cộng</span>
              <span className="text-2xl font-extrabold">{formatVND((cart?.subtotal ?? 0) + SHIPPING_FEE)}</span>
            </div>
            <p className="mt-1 text-xs text-ink-3">Mã giảm giá được áp dụng ở bước thanh toán.</p>
            {overStock ? (
              <Button size="lg" block className="mt-6" disabled>
                Điều chỉnh số lượng để tiếp tục
              </Button>
            ) : (
              <ButtonLink href="/checkout" size="lg" block className="mt-6" rightIcon={<ArrowRight size={18} />}>
                Tiến hành thanh toán
              </ButtonLink>
            )}
            <Link href="/products" className="mt-4 block text-center text-sm font-semibold text-ink-2 hover:text-ink">
              ← Tiếp tục mua sắm
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}
