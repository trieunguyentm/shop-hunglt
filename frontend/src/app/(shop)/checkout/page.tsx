'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Banknote, Lock, QrCode, ShoppingBag, Tag, X } from 'lucide-react';
import { applyPromotion, createOrder, getCart, getMe, getPaymentStatus } from '@/lib/api';
import { useAccessToken } from '@/hooks/useAccessToken';
import { useCartStore } from '@/lib/stores/cart';
import { errorMessage, formatVND } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/images';
import { SHIPPING_FEE } from '@/lib/orderStatus';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input, RadioCard, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/misc';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ApplyPromotionResult, Cart } from '@/lib/types';

const PHONE_RE = /^(0|\+84)\d{9,10}$/;

export default function CheckoutPage() {
  const { token, ready, session } = useAccessToken();
  const router = useRouter();
  const setCartStore = useCartStore((s) => s.setCart);

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [payosEnabled, setPayosEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState<ApplyPromotionResult | null>(null);
  const [promoError, setPromoError] = useState('');
  const [applying, setApplying] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ receiverName: '', receiverPhone: '', shippingAddress: '', paymentMethod: 'COD', note: '' });

  useEffect(() => {
    if (!token) {
      if (ready) setLoading(false);
      return;
    }
    Promise.all([getCart(token), getMe(token).catch(() => null)])
      .then(([c, me]) => {
        setCart(c.data);
        // Điền sẵn thông tin người nhận từ hồ sơ
        setForm((f) => ({
          ...f,
          receiverName: f.receiverName || me?.data.customer?.fullName || session?.user?.name || '',
          receiverPhone: f.receiverPhone || me?.data.customer?.phone || '',
        }));
      })
      .catch((e) => toast.error(errorMessage(e, 'Không tải được giỏ hàng')))
      .finally(() => setLoading(false));
    getPaymentStatus()
      .then((r) => setPayosEnabled(r.data.payos))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, ready]);

  const subtotal = cart?.subtotal ?? 0;
  const discount = promo?.discount ?? 0;
  const total = Math.max(0, subtotal - discount) + SHIPPING_FEE;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: '' }));
  };

  async function applyCode() {
    const code = promoCode.trim().toUpperCase();
    if (!token || !code) return;
    setApplying(true);
    setPromoError('');
    try {
      const r = await applyPromotion(token, code, subtotal);
      setPromo(r.data);
      toast.success(`Đã áp mã ${r.data.code} — giảm ${formatVND(r.data.discount)}`);
    } catch (e) {
      setPromo(null);
      setPromoError(errorMessage(e, 'Mã không hợp lệ'));
    } finally {
      setApplying(false);
    }
  }

  function validate() {
    const er: Record<string, string> = {};
    if (form.receiverName.trim().length < 2) er.receiverName = 'Nhập họ tên người nhận';
    if (!PHONE_RE.test(form.receiverPhone.replace(/\s/g, ''))) er.receiverPhone = 'Số điện thoại không hợp lệ (vd 0912345678)';
    if (form.shippingAddress.trim().length < 5) er.shippingAddress = 'Nhập địa chỉ giao hàng đầy đủ';
    setErrors(er);
    return Object.keys(er).length === 0;
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !validate()) return;
    setSubmitting(true);
    try {
      const res = await createOrder(token, {
        ...form,
        receiverPhone: form.receiverPhone.replace(/\s/g, ''),
        note: form.note.trim() || undefined,
        promotionCode: promo?.code,
      });
      setCartStore({ count: 0, subtotal: 0 });
      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl; // sang trang thanh toán PayOS
      } else {
        toast.success('Đặt hàng thành công!');
        router.push(`/orders/${res.data.order.id}?placed=1`);
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Đặt hàng thất bại'));
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container-page page-top grid gap-8 lg:grid-cols-[1fr_400px]">
        <Skeleton className="h-[520px] rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container-page page-top">
        <EmptyState
          icon={<ShoppingBag size={24} />}
          title="Giỏ hàng đang trống"
          description="Bạn cần thêm sản phẩm vào giỏ trước khi thanh toán."
          action={<ButtonLink href="/products">Đi mua sắm</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="container-page page-top">
      <ButtonLink href="/cart" variant="ghost" size="sm" className="-ml-3 mb-4" leftIcon={<ArrowLeft size={16} />}>
        Quay lại giỏ hàng
      </ButtonLink>
      <h1 className="heading-1 mb-8">Thanh toán</h1>

      <form onSubmit={placeOrder} noValidate className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-5 flex items-center gap-3 text-lg font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs text-white">1</span>
              Thông tin giao hàng
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Họ tên người nhận" required value={form.receiverName} onChange={set('receiverName')} error={errors.receiverName} autoComplete="name" />
              <Input label="Số điện thoại" required type="tel" inputMode="tel" value={form.receiverPhone} onChange={set('receiverPhone')} error={errors.receiverPhone} autoComplete="tel" placeholder="0912 345 678" />
              <Input label="Địa chỉ giao hàng" required wrapperClassName="sm:col-span-2" value={form.shippingAddress} onChange={set('shippingAddress')} error={errors.shippingAddress} autoComplete="street-address" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
              <Textarea label="Ghi chú" hint="Không bắt buộc — vd: giao giờ hành chính" rows={2} maxLength={500} wrapperClassName="sm:col-span-2" value={form.note} onChange={set('note')} />
            </div>
          </Card>

          <Card>
            <h2 className="mb-5 flex items-center gap-3 text-lg font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs text-white">2</span>
              Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              <RadioCard
                name="pm"
                checked={form.paymentMethod === 'COD'}
                onChange={() => setForm({ ...form, paymentMethod: 'COD' })}
                icon={<Banknote size={20} />}
                title="Thanh toán khi nhận hàng (COD)"
                description="Kiểm tra hàng rồi mới trả tiền"
              />
              <RadioCard
                name="pm"
                disabled={!payosEnabled}
                checked={form.paymentMethod === 'PAYOS'}
                onChange={() => setForm({ ...form, paymentMethod: 'PAYOS' })}
                icon={<QrCode size={20} />}
                title="Chuyển khoản / QR qua PayOS"
                description={payosEnabled ? 'Quét mã QR bằng app ngân hàng bất kỳ' : 'Tạm thời chưa khả dụng'}
              />
            </div>
          </Card>
        </div>

        <Card as="aside" className="lg:sticky lg:top-[calc(var(--header-h)+24px)]">
          <h2 className="text-lg font-bold">Đơn hàng ({cart.count})</h2>
          <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {cart.items.map((it) => (
              <li key={it.id} className="flex gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Image src={it.product.images[0]?.url ?? PLACEHOLDER_IMAGE} alt={it.product.name} fill sizes="56px" className="object-cover" />
                  <span className="absolute -right-0 -top-0 grid h-5 min-w-5 place-items-center rounded-bl-lg bg-ink px-1 text-2xs font-bold text-white">{it.quantity}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold">{it.product.name}</p>
                  <p className="text-xs text-ink-3">{[it.size, it.color].filter(Boolean).join(' · ') || 'Mặc định'}</p>
                </div>
                <p className="text-sm font-semibold">{formatVND(Number(it.product.salePrice) * it.quantity)}</p>
              </li>
            ))}
          </ul>

          <div className="my-5 h-px bg-line" />

          {promo ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-lime-100 px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Tag size={16} /> {promo.code}
                <span className="font-normal text-ink-2">−{formatVND(promo.discount)}</span>
              </p>
              <button type="button" aria-label="Bỏ mã giảm giá" onClick={() => { setPromo(null); setPromoCode(''); }} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white">
                <X size={15} />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <Input
                  wrapperClassName="flex-1"
                  placeholder="Mã giảm giá"
                  value={promoCode}
                  leftIcon={<Tag size={16} />}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void applyCode(); } }}
                  error={promoError || undefined}
                  aria-label="Mã giảm giá"
                />
                <Button variant="outline" onClick={applyCode} loading={applying} disabled={!promoCode.trim()}>
                  Áp dụng
                </Button>
              </div>
            </div>
          )}

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink-3">Tạm tính</dt><dd className="font-semibold">{formatVND(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-success"><dt>Giảm giá</dt><dd className="font-semibold">−{formatVND(discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-3">Phí vận chuyển</dt><dd className="font-semibold">{formatVND(SHIPPING_FEE)}</dd></div>
          </dl>
          <div className="my-5 h-px bg-line" />
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Tổng thanh toán</span>
            <span className="text-2xl font-extrabold text-brand-600">{formatVND(total)}</span>
          </div>
          <Button type="submit" size="lg" block className="mt-6" loading={submitting} leftIcon={<Lock size={16} />}>
            {form.paymentMethod === 'PAYOS' ? 'Đặt hàng & thanh toán' : 'Đặt hàng'}
          </Button>
          <p className="mt-3 text-center text-xs text-ink-3">Bằng việc đặt hàng, bạn đồng ý với chính sách đổi trả của MAISON.</p>
        </Card>
      </form>
    </div>
  );
}
