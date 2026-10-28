'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { ButtonLink } from '@/components/ui/Button';

const CODE = 'WELCOME10';

/** Banner mã giảm giá — bấm để sao chép mã. */
export function PromoBanner() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CODE);
      setCopied(true);
      toast.success(`Đã sao chép mã ${CODE}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không sao chép được, hãy nhập thủ công: ' + CODE);
    }
  }

  return (
    <section className="container-page py-10">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-white sm:px-12 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-lime-400/25 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-lime-400">Ưu đãi thành viên mới</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Giảm 10% cho đơn từ 300K</h2>
            <p className="mt-3 text-white/70">Nhập mã ở bước thanh toán. Áp dụng cho mọi sản phẩm, số lượng có hạn.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={copy}
              className="group flex h-14 items-center justify-between gap-6 rounded-full border-2 border-dashed border-lime-400 px-6 text-lg font-extrabold tracking-[0.12em] text-lime-400 transition-colors hover:bg-lime-400 hover:text-ink"
              aria-label={`Sao chép mã ${CODE}`}
            >
              {CODE}
              {copied ? <Check size={20} /> : <Copy size={18} className="opacity-70 group-hover:opacity-100" />}
            </button>
            <ButtonLink href="/products" variant="lime" size="lg" className="h-14">
              Mua ngay
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
