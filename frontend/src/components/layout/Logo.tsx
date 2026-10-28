import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Logo chữ MAISON + chấm lime đặc trưng. */
export function Logo({ className, href = '/', light }: { className?: string; href?: string; light?: boolean }) {
  return (
    <Link href={href} aria-label="MAISON — Trang chủ" className={cn('inline-flex items-baseline gap-0.5 text-2xl font-extrabold tracking-tightest', light ? 'text-white' : 'text-ink', className)}>
      MAISON
      <span className="inline-block h-2 w-2 rounded-full bg-lime-400 ring-2 ring-ink/0" />
    </Link>
  );
}
