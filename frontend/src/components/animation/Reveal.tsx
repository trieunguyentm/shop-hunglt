'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Độ trễ (giây) để tạo hiệu ứng so le. */
  delay?: number;
  /** Khoảng dịch chuyển ban đầu theo trục Y (px). */
  y?: number;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Bọc nội dung để tạo hiệu ứng "fade + trượt lên" khi cuộn tới.
 * Dùng GSAP ScrollTrigger — chuẩn animation toàn site.
 */
export function Reveal({ children, className, delay = 0, y = 28, as = 'div' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const Tag = as as 'div';

  useGSAP(
    () => {
      // Tôn trọng prefers-reduced-motion: hiện ngay, không animate
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(ref.current, { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        ref.current,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          delay,
          ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 85%' },
        },
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={cn('reveal-init', className)}>
      {children}
    </Tag>
  );
}
