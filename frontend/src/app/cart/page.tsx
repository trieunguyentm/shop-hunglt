'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getCart, removeCartItem, updateCartItem } from '@/lib/api';
import { useCartStore } from '@/lib/stores/cart';
import { formatVND } from '@/lib/utils';
import { ButtonLink } from '@/components/ui/Button';
import type { Cart } from '@/lib/types';

export default function CartPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const setCartStore = useCartStore((s) => s.setCart);

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    // Chưa có token → thoát trạng thái tải để không kẹt "Đang tải" vĩnh viễn.
    // SessionGuard chịu trách nhiệm điều hướng về /login nếu phiên đã chết.
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await getCart(token);
      setCart(r.data);
      setCartStore(r.data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [token, setCartStore]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function changeQty(id: string, qty: number) {
    if (!token || qty < 1) return;
    const r = await updateCartItem(token, id, qty);
    setCart(r.data);
    setCartStore(r.data);
  }
  async function remove(id: string) {
    if (!token) return;
    const r = await removeCartItem(token, id);
    setCart(r.data);
    setCartStore(r.data);
  }

  return (
    <div className="container-page min-h-screen pt-[calc(var(--header-h)+3rem)]">
      <h1 className="mb-10 text-display-md">Giỏ hàng</h1>

      {loading ? (
        <p className="text-mist">Đang tải...</p>
      ) : !cart || cart.items.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-line bg-bone p-12 text-center">
          <p className="mb-6 text-mist">Giỏ hàng của bạn đang trống.</p>
          <ButtonLink href="/products">Tiếp tục mua sắm</ButtonLink>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-3">
          <ul className="space-y-6 lg:col-span-2">
            {cart.items.map((it) => (
              <li key={it.id} className="flex gap-4 border-b border-line pb-6">
                <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-bone">
                  <Image
                    src={it.product.images[0]?.url ?? 'https://picsum.photos/seed/x/200/250'}
                    alt={it.product.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <Link href={`/products/${it.product.slug}`} className="font-display text-lg hover:text-clay">
                    {it.product.name}
                  </Link>
                  <p className="text-sm text-mist">
                    {[it.size, it.color].filter(Boolean).join(' · ') || 'Mặc định'}
                  </p>
                  <p className="text-sm text-graphite">{formatVND(it.product.salePrice)}</p>
                  <div className="mt-auto flex items-center gap-4">
                    <div className="flex items-center rounded-full border border-line">
                      <button className="px-3 py-1 text-lg" onClick={() => changeQty(it.id, it.quantity - 1)}>−</button>
                      <span className="w-8 text-center text-sm">{it.quantity}</span>
                      <button className="px-3 py-1 text-lg" onClick={() => changeQty(it.id, it.quantity + 1)}>+</button>
                    </div>
                    <button className="link-underline text-sm text-clay-dark" onClick={() => remove(it.id)}>
                      Xóa
                    </button>
                  </div>
                </div>
                <div className="text-right font-medium">
                  {formatVND(Number(it.product.salePrice) * it.quantity)}
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-xl2 border border-line bg-bone p-6">
            <h2 className="mb-4 font-display text-xl">Tổng cộng</h2>
            <div className="flex justify-between border-b border-line pb-4 text-sm text-graphite">
              <span>Tạm tính ({cart.count} sản phẩm)</span>
              <span>{formatVND(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between py-4 font-display text-xl">
              <span>Thành tiền</span>
              <span className="text-clay">{formatVND(cart.subtotal)}</span>
            </div>
            <ButtonLink href="/checkout" className="w-full">Thanh toán</ButtonLink>
          </aside>
        </div>
      )}
    </div>
  );
}
