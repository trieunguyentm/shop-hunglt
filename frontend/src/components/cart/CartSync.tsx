'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getCart } from '@/lib/api';
import { useCartStore } from '@/lib/stores/cart';

/** Đồng bộ giỏ hàng từ server vào store khi đã đăng nhập (cho badge Header). */
export function CartSync() {
  const { data: session, status } = useSession();
  const setCart = useCartStore((s) => s.setCart);
  const reset = useCartStore((s) => s.reset);

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      getCart(session.accessToken)
        .then((r) => setCart(r.data))
        .catch(() => undefined);
    } else if (status === 'unauthenticated') {
      reset();
    }
  }, [status, session?.accessToken, setCart, reset]);

  return null;
}
