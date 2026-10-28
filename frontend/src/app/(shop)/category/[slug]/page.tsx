import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PackageOpen, WifiOff } from 'lucide-react';
import { getCategories, getProducts } from '@/lib/api';
import { ProductGrid } from '@/components/product/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ButtonLink } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/misc';
import { Pagination } from '@/components/ui/Pagination';
import { categoryImage } from '@/lib/images';
import type { Category, ProductListItem } from '@/lib/types';

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

export async function generateMetadata({ params }: PageProps) {
  const cat = await getCategories()
    .then((r) => r.data.find((c) => c.slug === params.slug))
    .catch(() => undefined);
  return { title: cat?.name ?? 'Danh mục', description: cat?.description ?? undefined };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);
  let category: Category | undefined;
  let products: ProductListItem[] = [];
  let total = 0;
  let totalPages = 1;
  let apiDown = false;

  try {
    const [cats, prods] = await Promise.all([getCategories(), getProducts({ category: params.slug, pageSize: 12, page })]);
    category = cats.data.find((c) => c.slug === params.slug);
    products = prods.data;
    total = prods.meta?.total ?? products.length;
    totalPages = prods.meta?.totalPages ?? 1;
  } catch {
    apiDown = true;
  }

  if (!apiDown && !category) notFound();

  return (
    <div className="container-page page-top">
      <Breadcrumb className="mb-5" items={[{ label: 'Cửa hàng', href: '/products' }, { label: category?.name ?? params.slug }]} />

      <header className="relative mb-10 overflow-hidden rounded-[2rem] bg-ink">
        <Image src={categoryImage(params.slug)} alt="" fill priority sizes="100vw" className="object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
        <div className="relative px-6 py-14 sm:px-10 sm:py-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-lime-400">Danh mục</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{category?.name ?? params.slug}</h1>
          {category?.description && <p className="mt-3 max-w-lg text-white/75">{category.description}</p>}
          {!apiDown && <p className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">{total} sản phẩm</p>}
        </div>
      </header>

      {apiDown ? (
        <EmptyState icon={<WifiOff size={24} />} title="Chưa kết nối được máy chủ" description="Vui lòng thử lại sau ít phút." />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<PackageOpen size={24} />}
          title="Danh mục chưa có sản phẩm"
          description="Hàng mới đang về, quay lại sau nhé!"
          action={<ButtonLink href="/products">Xem tất cả sản phẩm</ButtonLink>}
        />
      ) : (
        <>
          <ProductGrid products={products} priorityCount={4} />
          <Pagination className="mt-14" page={page} totalPages={totalPages} hrefFor={(p) => `/category/${params.slug}?page=${p}`} />
        </>
      )}
    </div>
  );
}
