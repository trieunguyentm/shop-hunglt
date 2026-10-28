'use client';

import Link from 'next/link';
import { ChevronRight, Minus, Plus, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

/** Thẻ nền trắng bo góc — khối nội dung cơ bản. */
export function Card({ className, children, as: Tag = 'div' }: { className?: string; children: React.ReactNode; as?: 'div' | 'section' | 'aside' }) {
  return <Tag className={cn('rounded-3xl border border-line bg-surface p-5 sm:p-6', className)}>{children}</Tag>;
}

/** Tăng/giảm số lượng. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  busy,
  size = 'md',
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  busy?: boolean;
  size?: 'sm' | 'md';
}) {
  const btn = cn(
    'grid place-items-center rounded-full text-ink transition-colors hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent',
    size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
  );
  return (
    <div className={cn('inline-flex items-center rounded-full border border-line bg-surface p-0.5')}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={busy || value <= min} aria-label="Giảm số lượng">
        <Minus size={15} />
      </button>
      <span className={cn('grid place-items-center text-sm font-semibold tabular-nums', size === 'sm' ? 'w-7' : 'w-9')} aria-live="polite">
        {busy ? <Spinner size="xs" className="text-ink-3" /> : value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={busy || value >= max} aria-label="Tăng số lượng">
        <Plus size={15} />
      </button>
    </div>
  );
}

/** Nhóm lựa chọn dạng chip (lọc nhanh theo trạng thái...). Cuộn ngang trên mobile. */
export function Segmented<V extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: V;
  onChange: (v: V) => void;
  options: { value: V; label: React.ReactNode; count?: number }[];
  className?: string;
}) {
  return (
    <div className={cn('scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0', className)}>
      <div role="tablist" className="inline-flex gap-1.5">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(o.value)}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors',
                active ? 'bg-ink text-white' : 'border border-line bg-surface text-ink-2 hover:border-ink-4 hover:text-ink',
              )}
            >
              {o.label}
              {o.count !== undefined && (
                <span className={cn('rounded-full px-1.5 text-xs', active ? 'bg-white/20' : 'bg-muted text-ink-3')}>{o.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Đường dẫn phân cấp. Mục cuối là trang hiện tại (không có href). */
export function Breadcrumb({ items, className }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm text-ink-3', className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={14} className="text-ink-4" />}
            {it.href ? (
              <Link href={it.href} className="transition-colors hover:text-ink">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-ink">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Hiển thị / chấm điểm sao. Truyền onChange để thành ô nhập. */
export function Rating({ value, onChange, size = 16, className }: { value: number; onChange?: (v: number) => void; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        const star = <Star size={size} className={filled ? 'fill-star text-star' : 'fill-line text-line'} strokeWidth={1.5} />;
        return onChange ? (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={i === value}
            aria-label={`${i} sao`}
            onClick={() => onChange(i)}
            className="rounded p-0.5 transition-transform hover:scale-110"
          >
            {star}
          </button>
        ) : (
          <span key={i}>{star}</span>
        );
      })}
    </span>
  );
}

/** Ảnh đại diện chữ cái đầu. */
export function Avatar({ name, size = 36, className }: { name?: string | null; size?: number; className?: string }) {
  const initials = (name ?? '?')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-full bg-lime-400 font-bold text-ink', className)}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.38) }}
      aria-hidden
    >
      {initials || '?'}
    </span>
  );
}

/** Tiêu đề trang (khu quản trị & tài khoản): tiêu đề + mô tả + hành động bên phải. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="heading-1">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink-3 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Ô tóm tắt khóa–giá trị (chi tiết đơn, hồ sơ...). */
export function DescriptionList({ items, className }: { items: { label: string; value: React.ReactNode }[]; className?: string }) {
  return (
    <dl className={cn('divide-y divide-line', className)}>
      {items.map((it) => (
        <div key={it.label} className="flex items-start justify-between gap-4 py-3 text-sm">
          <dt className="text-ink-3">{it.label}</dt>
          <dd className="text-right font-medium text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
