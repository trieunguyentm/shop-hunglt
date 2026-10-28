import { Suspense } from 'react';
import { PackageSearch, WifiOff } from 'lucide-react';
import { getCategories, getProducts } from '@/lib/api';
import { ProductGrid } from '@/components/product/ProductCard';
import { FilterBar } from '@/components/product/FilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/misc';
import type { Category, ProductListItem } from '@/lib/types';

export const metadata = { title: 'Cửa hàng', description: 'Tất cả sản phẩm thời trang MAISON.' };

interface PageProps {
  searchParams: { category?: string; search?: string; sort?: string; page?: string };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);
  let products: ProductListItem[] = [];
  let categories: Category[] = [];
  let total = 0;
  let totalPages = 1;
  let apiDown = false;

  try {
    const [pRes, cRes] = await Promise.all([
      getProducts({ category: searchParams.category, search: searchParams.search, sort: searchParams.sort ?? 'newest', page, pageSize: 12 }),
      getCategories(),
    ]);
    products = pRes.data;
    total = pRes.meta?.total ?? products.length;
    totalPages = pRes.meta?.totalPages ?? 1;
    categories = cRes.data;
  } catch {
    apiDown = true;
  }

  const activeCat = categories.find((c) => c.slug === searchParams.category);

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    (['category', 'search', 'sort'] as const).forEach((k) => searchParams[k] && sp.set(k, searchParams[k]!));
    sp.set('page', String(p));
    return `/products?${sp.toString()}`;
  };

  return (
    <div className="container-page page-top">
      <Breadcrumb className="mb-4" items={[{ label: 'Trang chủ', href: '/' }, { label: 'Cửa hàng' }]} />
      <header className="mb-8">
        <h1 className="heading-1">{activeCat ? activeCat.name : 'Tất cả sản phẩm'}</h1>
        <p className="mt-2 text-ink-3">{activeCat?.description ?? 'Basic dễ phối, mặc đẹp mỗi ngày.'}</p>
      </header>

      {apiDown ? (
        <EmptyState icon={<WifiOff size={24} />} title="Chưa kết nối được máy chủ" description="Vui lòng thử lại sau ít phút." />
      ) : (
        <>
          {/* useSearchParams trong FilterBar cần Suspense boundary */}
          <Suspense>
            <FilterBar categories={categories} total={total} />
          </Suspense>
          {products.length === 0 ? (
            <EmptyState
              icon={<PackageSearch size={24} />}
              title="Không tìm thấy sản phẩm phù hợp"
              description="Thử đổi từ khóa hoặc bỏ bớt bộ lọc nhé."
              action={<ButtonLink href="/products" variant="outline">Xóa bộ lọc</ButtonLink>}
            />
          ) : (
            <ProductGrid products={products} priorityCount={4} />
          )}
          <Pagination className="mt-14" page={page} totalPages={totalPages} hrefFor={hrefFor} />
        </>
      )}
    </div>
  );
}
