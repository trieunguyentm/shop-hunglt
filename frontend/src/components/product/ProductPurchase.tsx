'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ShoppingBag, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { QuantityStepper } from '@/components/ui/misc';
import { cn, errorMessage, sortSizes } from '@/lib/utils';
import { addCartItem } from '@/lib/api';
import { useCartStore } from '@/lib/stores/cart';
import type { ProductDetail } from '@/lib/types';

/** Khối chọn biến thể (size × màu), số lượng, thêm giỏ / mua ngay. */
export function ProductPurchase({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { data: session } = useSession();
  const setCart = useCartStore((s) => s.setCart);

  const sizes = useMemo(() => sortSizes(Array.from(new Set(product.variants.map((v) => v.size)))), [product.variants]);
  const colors = useMemo(() => Array.from(new Set(product.variants.map((v) => v.color))), [product.variants]);
  const stockOf = (s: string | null, c: string | null) =>
    product.variants.find((v) => v.size === s && v.color === c)?.stock ?? 0;

  // Mặc định chọn tổ hợp đầu tiên còn hàng
  const firstInStock = sizes.flatMap((s) => product.variants.filter((v) => v.size === s)).find((v) => v.stock > 0);
  const [size, setSize] = useState<string | null>(firstInStock?.size ?? sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(firstInStock?.color ?? colors[0] ?? null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState<'cart' | 'buy' | null>(null);

  const hasVariants = product.variants.length > 0;
  const available = hasVariants ? stockOf(size, color) : product.stock;
  const inStock = available > 0;

  function pickSize(s: string) {
    setSize(s);
    setQty(1);
    // Màu đang chọn hết hàng ở size mới → chuyển sang màu còn hàng
    if (color && stockOf(s, color) <= 0) {
      const alt = colors.find((c) => stockOf(s, c) > 0);
      if (alt) setColor(alt);
    }
  }

  async function add(mode: 'cart' | 'buy') {
    if (!session?.accessToken) {
      signIn('keycloak', { callbackUrl: `/products/${product.slug}` });
      return;
    }
    setBusy(mode);
    try {
      const res = await addCartItem(session.accessToken, { productId: product.id, size, color, quantity: qty });
      setCart(res.data);
      if (mode === 'buy') {
        router.push('/cart');
      } else {
        toast.success('Đã thêm vào giỏ hàng', {
          description: [product.name, size, color].filter(Boolean).join(' · '),
          action: { label: 'Xem giỏ', onClick: () => router.push('/cart') },
        });
      }
    } catch (e) {
      toast.error(errorMessage(e, 'Thêm vào giỏ thất bại'));
    } finally {
      setBusy(null);
    }
  }

  const chip = (selected: boolean, disabled: boolean) =>
    cn(
      'relative h-11 min-w-12 rounded-xl border px-4 text-sm font-semibold transition-all',
      selected ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:border-ink',
      disabled && !selected && 'border-dashed text-ink-4 line-through decoration-1 hover:border-line',
    );

  return (
    <div className="space-y-6">
      {sizes.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 flex w-full items-center justify-between text-sm font-semibold">
            <span>
              Kích cỡ: <span className="text-ink-2">{size}</span>
            </span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const soldOut = colors.every((c) => stockOf(s, c) <= 0);
              return (
                <button key={s} type="button" aria-pressed={s === size} disabled={soldOut} onClick={() => pickSize(s)} className={chip(s === size, soldOut)}>
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {colors.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 text-sm font-semibold">
            Màu sắc: <span className="text-ink-2">{color}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const soldOut = stockOf(size, c) <= 0;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={c === color}
                  onClick={() => {
                    setColor(c);
                    setQty(1);
                  }}
                  className={chip(c === color, soldOut)}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <QuantityStepper value={qty} onChange={setQty} min={1} max={Math.max(1, available)} />
        <p className="text-sm">
          {inStock ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-success">
              <span className="h-2 w-2 rounded-full bg-success" />
              Còn {available} sản phẩm
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-medium text-danger">
              <span className="h-2 w-2 rounded-full bg-danger" />
              Phân loại này đã hết hàng
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Button size="lg" variant="outline" leftIcon={<ShoppingBag size={18} />} onClick={() => add('cart')} disabled={!inStock || !!busy} loading={busy === 'cart'}>
          Thêm vào giỏ
        </Button>
        <Button size="lg" leftIcon={<Zap size={18} />} onClick={() => add('buy')} disabled={!inStock || !!busy} loading={busy === 'buy'}>
          Mua ngay
        </Button>
      </div>
    </div>
  );
}
