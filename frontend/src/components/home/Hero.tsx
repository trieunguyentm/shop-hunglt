'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ButtonLink } from '@/components/ui/Button';

// Nạp scene 3D ở client, không SSR (three.js cần window)
const FabricScene = dynamic(() => import('@/components/three/FabricScene'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-full bg-bone" />,
});

export function Hero() {
  const root = useRef<HTMLDivElement>(null);

  // Intro timeline: các dòng chữ trượt lên lần lượt
  useGSAP(
    () => {
      // Tôn trọng prefers-reduced-motion: bỏ qua intro animation
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.from('[data-hero-line]', {
        yPercent: 120,
        duration: 1.1,
        stagger: 0.12,
      })
        .from('[data-hero-sub]', { opacity: 0, y: 20, duration: 0.8 }, '-=0.5')
        .from('[data-hero-cta]', { opacity: 0, y: 20, duration: 0.7 }, '-=0.5')
        .from('[data-hero-3d]', { opacity: 0, scale: 0.85, duration: 1.2 }, '-=1.1');
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative min-h-screen overflow-hidden pt-[var(--header-h)]"
    >
      <div className="container-page grid min-h-[calc(100vh-var(--header-h))] items-center gap-8 lg:grid-cols-2">
        {/* Cột chữ */}
        <div className="relative z-10 py-16">
          <p className="eyebrow mb-6">Bộ sưu tập Xuân — Hè 2026</p>
          {/* pt/pb + margin âm: mở rộng vùng hiển thị cho dấu tiếng Việt & đuôi chữ (g, y)
              mà không phá vỡ canh dòng — tránh bị overflow-hidden cắt mất glyph. */}
          <h1 className="text-display-xl">
            <span className="block overflow-hidden pb-[0.18em] -mb-[0.12em] pt-[0.12em] -mt-[0.12em]">
              <span data-hero-line className="block leading-[1.06]">
                Phong cách
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.18em] -mb-[0.12em] pt-[0.12em] -mt-[0.12em]">
              <span data-hero-line className="block italic leading-[1.06] text-clay">
                vượt thời gian
              </span>
            </span>
          </h1>
          <p data-hero-sub className="mt-7 max-w-md text-base leading-relaxed text-graphite">
            Những thiết kế tối giản, chất liệu bền vững, tôn vinh vẻ đẹp tự nhiên
            của người mặc trong từng chuyển động.
          </p>
          <div data-hero-cta className="mt-9 flex flex-wrap items-center gap-4">
            <ButtonLink href="/products">Khám phá ngay</ButtonLink>
            <ButtonLink href="/#collections" variant="outline">
              Xem bộ sưu tập
            </ButtonLink>
          </div>
        </div>

        {/* Cột 3D */}
        <div data-hero-3d className="relative h-[42vh] w-full lg:h-[80vh]">
          <FabricScene />
        </div>
      </div>

      {/* Gợi ý cuộn */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <span className="eyebrow">Cuộn xuống</span>
        <div className="mx-auto mt-3 h-10 w-px bg-gradient-to-b from-ink/40 to-transparent" />
      </div>
    </section>
  );
}
