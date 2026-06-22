import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  baseParams: Record<string, string | undefined>;
}

function buildHref(baseParams: Record<string, string | undefined>, page: number) {
  const sp = new URLSearchParams();
  Object.entries(baseParams).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  sp.set('page', String(page));
  return `/products?${sp.toString()}`;
}

export function Pagination({ page, totalPages, baseParams }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Phân trang">
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(baseParams, p)}
          className={cn(
            'grid h-10 w-10 place-items-center rounded-full text-sm transition-colors',
            p === page ? 'bg-ink text-ivory' : 'border border-line text-graphite hover:border-ink',
          )}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
