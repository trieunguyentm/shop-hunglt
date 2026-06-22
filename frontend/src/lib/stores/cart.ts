import { create } from 'zustand';
import type { Cart } from '@/lib/types';

interface CartState {
  count: number;
  subtotal: number;
  setCart: (cart: Pick<Cart, 'count' | 'subtotal'>) => void;
  reset: () => void;
}

/** Store nhẹ giữ số lượng giỏ để hiển thị badge ở Header (đồng bộ từ server). */
export const useCartStore = create<CartState>((set) => ({
  count: 0,
  subtotal: 0,
  setCart: (cart) => set({ count: cart.count, subtotal: cart.subtotal }),
  reset: () => set({ count: 0, subtotal: 0 }),
}));
