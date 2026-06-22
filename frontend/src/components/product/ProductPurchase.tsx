'use client';

import { useMemo, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { addCartItem } from '@/lib/api';
import { useCartStore } from '@/lib/stores/cart';
import type { ProductDetail } from '@/lib/types';

/**
 * Khối chọn biến thể (size/màu) + thêm giỏ.
 * Giỏ hàng đầy đủ sẽ hoàn thiện ở Phase 3 — hiện chỉ xác nhận lựa chọn.
 */
export function ProductPurchase({ product }: { product: ProductDetail }) {
  const sizes = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.size))),
    [product.variants],
  );
  const colors = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.color))),
    [product.variants],
  );

  const { data: session } = useSession();
  const setCart = useCartStore((s) => s.setCart);
  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const [adding, setAdding] = useState(false);

  const selectedVariant = product.variants.find((v) => v.size === size && v.color === color);
  const inStock = selectedVariant ? selectedVariant.stock > 0 : product.stock > 0;

  async function addToCart() {
    if (sizes.length && !size) return toast.error('Vui lòng chọn kích cỡ');
    if (colors.length && !color) return toast.error('Vui lòng chọn màu');
    if (!session?.accessToken) {
      signIn('keycloak', { callbackUrl: `/products/${product.slug}` });
      return;
    }
    setAdding(true);
    try {
      const res = await addCartItem(session.accessToken, {
        productId: product.id,
        size,
        color,
        quantity: 1,
      });
      setCart(res.data);
      toast.success('Đã thêm vào giỏ hàng');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Thêm giỏ thất bại');
    } finally {
      setAdding(false);
    }
  }

  const chip =
    'min-w-[44px] rounded-full border px-4 py-2 text-sm transition-colors';

  return (
    <div className="space-y-6">
      {sizes.length > 0 && (
        <div>
          <p className="eyebrow mb-3">Kích cỡ</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={cn(chip, s === size ? 'border-ink bg-ink text-ivory' : 'border-line hover:border-ink')}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <p className="eyebrow mb-3">Màu sắc</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(chip, c === color ? 'border-ink bg-ink text-ivory' : 'border-line hover:border-ink')}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-graphite">
        {inStock ? (
          <span className="text-sage">● Còn hàng{selectedVariant ? ` (${selectedVariant.stock})` : ''}</span>
        ) : (
          <span className="text-clay-dark">● Hết hàng</span>
        )}
      </p>

      <Button className="w-full sm:w-auto" onClick={addToCart} disabled={!inStock || adding}>
        {adding ? 'Đang thêm...' : 'Thêm vào giỏ'}
      </Button>
    </div>
  );
}
