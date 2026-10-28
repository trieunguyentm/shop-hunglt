import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Dãy số trang rút gọn: 1 … 4 5 [6] 7 8 … 20 */
export function pageRange(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push('…');
  out.push(total);
  return out;
}

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Phân trang qua URL (Server Component). */
  hrefFor?: (page: number) => string;
  /** Phân trang qua state (Client Component). */
  onChange?: (page: number) => void;
  className?: string;
}

const itemCls = 'grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-semibold transition-colors';

export function Pagination({ page, totalPages, hrefFor, onChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const renderItem = (p: number, content: React.ReactNode, opts: { active?: boolean; disabled?: boolean; label?: string } = {}) => {
    const cls = cn(
      itemCls,
      opts.active ? 'bg-ink text-white' : 'text-ink-2 hover:bg-muted hover:text-ink',
      opts.disabled && 'pointer-events-none opacity-30',
    );
    if (hrefFor && !opts.disabled) {
      return (
        <Link key={opts.label ?? p} href={hrefFor(p)} aria-label={opts.label} aria-current={opts.active ? 'page' : undefined} className={cls} scroll>
          {content}
        </Link>
      );
    }
    return (
      <button
        key={opts.label ?? p}
        type="button"
        aria-label={opts.label}
        aria-current={opts.active ? 'page' : undefined}
        disabled={opts.disabled}
        onClick={() => onChange?.(p)}
        className={cls}
      >
        {content}
      </button>
    );
  };

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} aria-label="Phân trang">
      {renderItem(page - 1, <ChevronLeft size={18} />, { disabled: page <= 1, label: 'Trang trước' })}
      {pageRange(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1 text-ink-4">
            …
          </span>
        ) : (
          renderItem(p, p, { active: p === page })
        ),
      )}
      {renderItem(page + 1, <ChevronRight size={18} />, { disabled: page >= totalPages, label: 'Trang sau' })}
    </nav>
  );
}
