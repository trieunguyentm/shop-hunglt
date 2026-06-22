'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { applyPromotion, createOrder, getCart, getPaymentStatus } from '@/lib/api';
import { useCartStore } from '@/lib/stores/cart';
import { formatVND } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { ApplyPromotionResult } from '@/lib/types';

const SHIPPING_FEE = 30000;

export default function CheckoutPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const router = useRouter();
  const setCartStore = useCartStore((s) => s.setCart);

  const [subtotal, setSubtotal] = useState(0);
  const [count, setCount] = useState(0);
  const [payosEnabled, setPayosEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState<ApplyPromotionResult | null>(null);
  const [promoMsg, setPromoMsg] = useState('');
  const [form, setForm] = useState({
    receiverName: session?.user?.name ?? '',
    receiverPhone: '',
    shippingAddress: '',
    paymentMethod: 'COD',
    note: '',
  });

  useEffect(() => {
    if (!token) return;
    getCart(token).then((r) => {
      setSubtotal(r.data.subtotal);
      setCount(r.data.count);
    });
    getPaymentStatus().then((r) => setPayosEnabled(r.data.payos)).catch(() => undefined);
  }, [token]);

  async function applyCode() {
    if (!token || !promoCode.trim()) return;
    setPromoMsg('');
    try {
      const r = await applyPromotion(token, promoCode.trim(), subtotal);
      setPromo(r.data);
      setPromoMsg(`Đã áp mã "${r.data.code}" — giảm ${formatVND(r.data.discount)}`);
    } catch (e) {
      setPromo(null);
      setPromoMsg(e instanceof Error ? e.message : 'Mã không hợp lệ');
    }
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await createOrder(token, {
        ...form,
        shippingFee: SHIPPING_FEE,
        promotionCode: promo?.code,
      });
      // Cập nhật badge giỏ (đã trống)
      setCartStore({ count: 0, subtotal: 0 });
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl; // chuyển sang PayOS
      } else {
        router.push(`/orders/${res.data.order.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đặt hàng thất bại');
      setSubmitting(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-line bg-ivory px-4 py-3 text-sm outline-none focus:border-ink';
  const discount = promo?.discount ?? 0;
  const total = subtotal - discount + (count > 0 ? SHIPPING_FEE : 0);

  return (
    <div className="container-page min-h-screen pt-[calc(var(--header-h)+3rem)]">
      <h1 className="mb-10 text-display-md">Thanh toán</h1>

      {count === 0 ? (
        <p className="text-mist">Giỏ hàng trống — không thể thanh toán.</p>
      ) : (
        <form onSubmit={placeOrder} className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div>
              <p className="eyebrow mb-3">Thông tin giao hàng</p>
              <div className="space-y-3">
                <input className={inputCls} placeholder="Họ tên người nhận" value={form.receiverName} onChange={(e) => setForm({ ...form, receiverName: e.target.value })} required />
                <input className={inputCls} placeholder="Số điện thoại" value={form.receiverPhone} onChange={(e) => setForm({ ...form, receiverPhone: e.target.value })} required />
                <input className={inputCls} placeholder="Địa chỉ giao hàng" value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} required />
                <textarea className={inputCls} rows={2} placeholder="Ghi chú (tùy chọn)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
            </div>

            <div>
              <p className="eyebrow mb-3">Phương thức thanh toán</p>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line p-4">
                  <input type="radio" name="pm" checked={form.paymentMethod === 'COD'} onChange={() => setForm({ ...form, paymentMethod: 'COD' })} />
                  <span>Thanh toán khi nhận hàng (COD)</span>
                </label>
                <label className={`flex items-center gap-3 rounded-lg border border-line p-4 ${payosEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                  <input type="radio" name="pm" disabled={!payosEnabled} checked={form.paymentMethod === 'PAYOS'} onChange={() => setForm({ ...form, paymentMethod: 'PAYOS' })} />
                  <span>Thanh toán online qua PayOS (QR/chuyển khoản){!payosEnabled && ' — chưa cấu hình'}</span>
                </label>
              </div>
            </div>

            {error && <p className="text-sm text-clay-dark">{error}</p>}
          </div>

          <aside className="h-fit rounded-xl2 border border-line bg-bone p-6">
            <h2 className="mb-4 font-display text-xl">Đơn hàng</h2>
            {/* Mã khuyến mãi */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-line bg-ivory px-3 py-2 text-sm outline-none focus:border-ink"
                  placeholder="Mã khuyến mãi"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={applyCode}>Áp dụng</Button>
              </div>
              {promoMsg && (
                <p className={`mt-2 text-xs ${promo ? 'text-sage' : 'text-clay-dark'}`}>{promoMsg}</p>
              )}
            </div>

            <div className="space-y-2 border-b border-line pb-4 text-sm text-graphite">
              <div className="flex justify-between"><span>Tạm tính ({count})</span><span>{formatVND(subtotal)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-sage"><span>Giảm giá</span><span>−{formatVND(discount)}</span></div>
              )}
              <div className="flex justify-between"><span>Phí vận chuyển</span><span>{formatVND(SHIPPING_FEE)}</span></div>
            </div>
            <div className="flex justify-between py-4 font-display text-xl">
              <span>Tổng</span><span className="text-clay">{formatVND(total)}</span>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
            </Button>
          </aside>
        </form>
      )}
    </div>
  );
}
