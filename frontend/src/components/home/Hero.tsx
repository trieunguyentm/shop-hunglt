'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight, RotateCcw, Sparkles, Truck } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { SITE_IMAGES } from '@/lib/images';

// Scene 3D chỉ chạy ở client (three.js cần window) — làm nền trang trí phía sau ảnh
const FabricScene = dynamic(() => import('@/components/three/FabricScene'), { ssr: false });

export function Hero() {
  const root = useRef<HTMLElement>(null);

  // Intro timeline: chữ trượt lên lần lượt, ảnh nổi lên
  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.from('[data-hero-line]', { yPercent: 110, duration: 1, stagger: 0.1 })
        .from('[data-hero-fade]', { opacity: 0, y: 16, duration: 0.6, stagger: 0.08 }, '-=0.6')
        .from('[data-hero-img]', { opacity: 0, y: 40, rotate: 0, duration: 1, stagger: 0.12 }, '-=0.9')
        .from('[data-hero-sticker]', { scale: 0, rotate: -40, duration: 0.6, ease: 'back.out(2)' }, '-=0.4');
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden">
      <div className="container-page grid items-center gap-10 pb-16 pt-8 sm:pt-12 lg:min-h-[calc(100vh-var(--header-h)-36px)] lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:py-12">
        {/* Cột chữ */}
        <div className="relative z-10">
          <p data-hero-fade className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold shadow-soft">
            <span className="rounded-full bg-lime-400 px-2 py-0.5 text-2xs font-bold uppercase">Mới</span>
            Bộ sưu tập Thu — Đông 2026
          </p>

          {/* pb + margin âm: chừa chỗ cho dấu tiếng Việt khi overflow-hidden */}
          <h1 className="heading-display">
            <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
              <span data-hero-line className="block">
                Mặc đơn giản,
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.14em] -mb-[0.12em]">
              <span data-hero-line className="block">
                sống <span className="mark-lime">thật chất</span>
                <span className="text-brand-500">.</span>
              </span>
            </span>
          </h1>

          <p data-hero-fade className="mt-6 max-w-md text-base text-ink-2 sm:text-lg">
            Basic dễ phối, chất liệu thoáng mát, form chuẩn dáng người Việt. Lên đồ đi học, đi làm hay đi chơi đều ổn.
          </p>

          <div data-hero-fade className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/products" size="lg" rightIcon={<ArrowRight size={18} />}>
              Mua sắm ngay
            </ButtonLink>
            <ButtonLink href="/collections" size="lg" variant="outline">
              Xem bộ sưu tập
            </ButtonLink>
          </div>

          <ul data-hero-fade className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-ink-2">
            <li className="flex items-center gap-2"><Truck size={17} className="text-brand-600" /> Giao toàn quốc</li>
            <li className="flex items-center gap-2"><RotateCcw size={17} className="text-brand-600" /> Đổi trả 30 ngày</li>
            <li className="flex items-center gap-2"><Sparkles size={17} className="text-brand-600" /> Mẫu mới mỗi tuần</li>
          </ul>
        </div>

        {/* Cột ảnh collage */}
        <div className="relative mx-auto h-[440px] w-full max-w-[520px] sm:h-[540px] lg:h-[600px]">
          <div className="pointer-events-none absolute -inset-10 hidden opacity-60 lg:block" aria-hidden>
            <FabricScene />
          </div>
          <div data-hero-img className="absolute left-0 top-0 h-[78%] w-[62%] -rotate-3 overflow-hidden rounded-[2rem] border-4 border-surface bg-muted shadow-pop">
            <Image src={SITE_IMAGES.hero[0]} alt="Người mẫu mặc hoodie và quần jogger" fill priority sizes="(max-width: 1024px) 60vw, 30vw" className="object-cover" />
          </div>
          <div data-hero-img className="absolute bottom-0 right-0 h-[70%] w-[56%] rotate-3 overflow-hidden rounded-[2rem] border-4 border-surface bg-muted shadow-pop">
            <Image src={SITE_IMAGES.hero[1]} alt="Người mẫu nam phong cách streetwear" fill priority sizes="(max-width: 1024px) 55vw, 28vw" className="object-cover" />
          </div>
          <div
            data-hero-sticker
            className="absolute right-[8%] top-[6%] grid h-24 w-24 rotate-12 place-items-center rounded-full bg-lime-400 text-center text-ink shadow-pop sm:h-28 sm:w-28"
          >
            <span className="text-xs font-extrabold uppercase leading-tight">
              Giảm
              <span className="block text-2xl sm:text-3xl">10%</span>
              từ 300K
            </span>
          </div>
          <div data-hero-img className="absolute bottom-[10%] left-[4%] rounded-2xl bg-surface px-4 py-3 shadow-pop">
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-3">Mã giảm giá</p>
            <p className="text-lg font-extrabold tracking-wide">WELCOME10</p>
          </div>
        </div>
      </div>
    </section>
  );
}
