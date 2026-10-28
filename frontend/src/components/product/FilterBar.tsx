'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import type { Category } from '@/lib/types';

const SORTS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá: thấp → cao' },
  { value: 'price_desc', label: 'Giá: cao → thấp' },
];

/** Thanh lọc sản phẩm: chip danh mục + tìm kiếm + sắp xếp. Trạng thái nằm trên URL. */
export function FilterBar({ categories, total }: { categories: Category[]; total: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [term, setTerm] = useState(params.get('search') ?? '');
  const category = params.get('category') ?? '';
  const search = params.get('search') ?? '';

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete('page'); // đổi bộ lọc → về trang 1
      startTransition(() => router.push(`/products?${next.toString()}`, { scroll: false }));
    },
    [params, router],
  );

  const chip = (active: boolean) =>
    cn(
      'h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors',
      active ? 'bg-ink text-white' : 'border border-line bg-surface text-ink-2 hover:border-ink-4 hover:text-ink',
    );

  return (
    <div className="mb-8 space-y-4">
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <button className={chip(!category)} onClick={() => setParam('category', '')}>
          Tất cả
        </button>
        {categories.map((c) => (
          <button key={c.id} className={chip(category === c.slug)} onClick={() => setParam('category', c.slug)}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          className="relative flex-1"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setParam('search', term.trim());
          }}
        >
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Tìm trong cửa hàng... (Enter để tìm)"
            aria-label="Tìm kiếm sản phẩm"
            className="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-11 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-ink-3 hover:border-ink-4 focus:border-ink focus:shadow-ring"
          />
          {term && (
            <button
              type="button"
              aria-label="Xóa từ khóa"
              onClick={() => {
                setTerm('');
                if (search) setParam('search', '');
              }}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ink-3 hover:bg-muted hover:text-ink"
            >
              <X size={15} />
            </button>
          )}
        </form>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="flex items-center gap-2 whitespace-nowrap text-sm text-ink-3">
            {pending && <Spinner size="xs" />}
            <span>
              <b className="font-bold text-ink">{total}</b> sản phẩm
            </span>
          </p>
          <Select
            pill
            aria-label="Sắp xếp"
            value={params.get('sort') ?? 'newest'}
            onChange={(v) => setParam('sort', v)}
            options={SORTS}
            wrapperClassName="w-52"
            renderValue={(o) => (
              <span className="truncate">
                <span className="text-ink-3">Sắp xếp: </span>
                {o?.label}
              </span>
            )}
          />
        </div>
      </div>

      {search && (
        <p className="text-sm text-ink-2">
          Kết quả cho <b>“{search}”</b>
        </p>
      )}
    </div>
  );
}
