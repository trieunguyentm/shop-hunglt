import { getCategories, getProducts } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';
import { FilterBar } from '@/components/product/FilterBar';
import { Pagination } from '@/components/product/Pagination';
import type { Category, ProductListItem } from '@/lib/types';

export const metadata = { title: 'Sản phẩm — MAISON' };

interface PageProps {
  searchParams: { category?: string; search?: string; sort?: string; page?: string };
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page ?? '1') || 1;
  let products: ProductListItem[] = [];
  let categories: Category[] = [];
  let total = 0;
  let totalPages = 1;
  let apiDown = false;

  try {
    const [pRes, cRes] = await Promise.all([
      getProducts({
        category: searchParams.category,
        search: searchParams.search,
        sort: searchParams.sort ?? 'newest',
        page,
        pageSize: 12,
      }),
      getCategories(),
    ]);
    products = pRes.data;
    total = pRes.meta?.total ?? products.length;
    totalPages = pRes.meta?.totalPages ?? 1;
    categories = cRes.data;
  } catch {
    apiDown = true;
  }

  return (
    <div className="container-page pt-[calc(var(--header-h)+3rem)]">
      <header className="mb-10">
        <p className="eyebrow mb-3">Cửa hàng</p>
        <h1 className="text-display-md">Tất cả sản phẩm</h1>
        {!apiDown && <p className="mt-2 text-sm text-mist">{total} sản phẩm</p>}
      </header>

      {apiDown ? (
        <p className="rounded-xl2 border border-dashed border-line bg-bone p-10 text-center text-sm text-mist">
          Chưa kết nối được API. Hãy chạy backend (xem README) để hiển thị sản phẩm.
        </p>
      ) : (
        <>
          <FilterBar categories={categories} />
          {products.length === 0 ? (
            <p className="py-20 text-center text-mist">Không tìm thấy sản phẩm phù hợp.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            baseParams={{
              category: searchParams.category,
              search: searchParams.search,
              sort: searchParams.sort,
            }}
          />
        </>
      )}
    </div>
  );
}
