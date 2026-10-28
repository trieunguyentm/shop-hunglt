import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/animation/Reveal';

/** Tiêu đề section: eyebrow + tiêu đề + link "Xem tất cả" bên phải. */
export function SectionHeading({ eyebrow, title, href, linkLabel = 'Xem tất cả' }: { eyebrow: string; title: React.ReactNode; href?: string; linkLabel?: string }) {
  return (
    <Reveal className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h2 className="heading-2 max-w-lg">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="group hidden shrink-0 items-center gap-1.5 text-sm font-semibold sm:inline-flex">
          <span className="link-underline">{linkLabel}</span>
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </Reveal>
  );
}
