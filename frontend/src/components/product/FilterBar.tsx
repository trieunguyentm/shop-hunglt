'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { Category } from '@/lib/types';

const SORTS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
];

export function FilterBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete('page'); // đổi bộ lọc → về trang 1
      router.push(`/products?${next.toString()}`);
    },
    [params, router],
  );

  return (
    <div className="mb-10 flex flex-wrap items-center gap-3">
      <select
        className="select-field"
        value={params.get('category') ?? ''}
        onChange={(e) => setParam('category', e.target.value)}
        aria-label="Lọc theo danh mục"
      >
        <option value="">Tất cả danh mục</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        className="select-field"
        value={params.get('sort') ?? 'newest'}
        onChange={(e) => setParam('sort', e.target.value)}
        aria-label="Sắp xếp"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <input
        className="input-field min-w-[200px] flex-1"
        placeholder="Tìm sản phẩm..."
        defaultValue={params.get('search') ?? ''}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setParam('search', (e.target as HTMLInputElement).value);
        }}
        aria-label="Tìm kiếm"
      />
    </div>
  );
}
