'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { getProducts } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';
import type { ProductListItem } from '@/lib/types';

function SearchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get('q') ?? '';
  const [term, setTerm] = useState(q);
  const [results, setResults] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    getProducts({ search: q, pageSize: 24 })
      .then((r) => setResults(r.data))
      .finally(() => setLoading(false));
  }, [q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(term.trim())}`);
  }

  return (
    <div className="container-page min-h-screen pt-[calc(var(--header-h)+3rem)]">
      <p className="eyebrow mb-3">Tìm kiếm</p>
      <h1 className="mb-8 text-display-md">Bạn đang tìm gì?</h1>

      <form onSubmit={submit} className="relative mb-12 max-w-xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
        <input
          autoFocus
          className="w-full rounded-full border border-line bg-ivory py-3 pl-11 pr-5 text-sm outline-none focus:border-ink"
          placeholder="Tên sản phẩm..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </form>

      {q && (
        <p className="mb-8 text-sm text-mist">
          {loading ? 'Đang tìm...' : `${results.length} kết quả cho “${q}”`}
        </p>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {q && !loading && results.length === 0 && (
        <p className="py-12 text-center text-mist">Không tìm thấy sản phẩm phù hợp.</p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-page pt-[calc(var(--header-h)+3rem)] text-mist">Đang tải...</div>}>
      <SearchInner />
    </Suspense>
  );
}
