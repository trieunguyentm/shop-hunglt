'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, SearchX, X } from 'lucide-react';
import { getProducts } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { ProductGrid } from '@/components/product/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ProductListItem } from '@/lib/types';

const SUGGESTIONS = ['Áo thun', 'Sơ mi', 'Jean', 'Đầm', 'Chân váy', 'Túi tote'];

function SearchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [term, setTerm] = useState(params.get('q') ?? '');
  const q = useDebounce(term.trim(), 350);
  const [results, setResults] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Đồng bộ từ khóa lên URL (chia sẻ được link kết quả) & gọi API khi người dùng ngừng gõ
  useEffect(() => {
    router.replace(q ? `/search?q=${encodeURIComponent(q)}` : '/search', { scroll: false });
    if (!q) {
      setResults([]);
      setTotal(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    getProducts({ search: q, pageSize: 24 })
      .then((r) => {
        if (cancelled) return;
        setResults(r.data);
        setTotal(r.meta?.total ?? r.data.length);
      })
      .catch(() => !cancelled && setError('Không kết nối được máy chủ'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, router]);

  return (
    <div className="container-page page-top">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow mb-2">Tìm kiếm</p>
        <h1 className="heading-1">Bạn đang tìm gì hôm nay?</h1>
        <form onSubmit={(e) => e.preventDefault()} className="relative mt-8" role="search">
          <Search size={20} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Nhập tên sản phẩm..."
            aria-label="Từ khóa tìm kiếm"
            className="h-14 w-full rounded-full border-2 border-ink bg-surface pl-14 pr-14 text-base font-medium outline-none transition-shadow placeholder:font-normal placeholder:text-ink-3 focus:shadow-ring"
          />
          {term && (
            <button type="button" aria-label="Xóa" onClick={() => setTerm('')} className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full hover:bg-muted">
              <X size={18} />
            </button>
          )}
        </form>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => setTerm(s)} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:border-ink hover:text-ink">
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12">
        {q && !loading && !error && (
          <p className="mb-6 text-sm text-ink-3">
            <b className="text-ink">{total}</b> kết quả cho “{q}”
          </p>
        )}
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : error ? (
          <EmptyState tone="danger" title={error} description="Vui lòng thử lại sau ít phút." />
        ) : results.length > 0 ? (
          <>
            <ProductGrid products={results} />
            {total > results.length && (
              <p className="mt-10 text-center text-sm">
                <Link href={`/products?search=${encodeURIComponent(q)}`} className="link-underline font-semibold">
                  Xem tất cả {total} kết quả trong cửa hàng →
                </Link>
              </p>
            )}
          </>
        ) : q ? (
          <EmptyState icon={<SearchX size={24} />} title="Không tìm thấy sản phẩm phù hợp" description="Thử từ khóa ngắn hơn hoặc chọn một gợi ý ở trên." />
        ) : null}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-page page-top"><ProductGridSkeleton count={4} /></div>}>
      <SearchInner />
    </Suspense>
  );
}
