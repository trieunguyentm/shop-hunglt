import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategories, getProducts } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';
import type { Category, ProductListItem } from '@/lib/types';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  return { title: `Danh mục — MAISON`, description: `Sản phẩm thuộc danh mục ${params.slug}` };
}

export default async function CategoryPage({ params }: PageProps) {
  let category: Category | undefined;
  let products: ProductListItem[] = [];
  let apiDown = false;

  try {
    const [cats, prods] = await Promise.all([
      getCategories(),
      getProducts({ category: params.slug, pageSize: 24 }),
    ]);
    category = cats.data.find((c) => c.slug === params.slug);
    products = prods.data;
  } catch {
    apiDown = true;
  }

  if (!apiDown && !category) notFound();

  return (
    <div className="container-page min-h-screen pt-[calc(var(--header-h)+3rem)]">
      <nav className="mb-6 text-sm text-mist">
        <Link href="/products" className="link-underline">Cửa hàng</Link>
        {category && <span> / {category.name}</span>}
      </nav>

      <header className="mb-10">
        <p className="eyebrow mb-3">Danh mục</p>
        <h1 className="text-display-md">{category?.name ?? params.slug}</h1>
        {category?.description && <p className="mt-3 max-w-xl text-graphite">{category.description}</p>}
      </header>

      {apiDown ? (
        <p className="rounded-xl2 border border-dashed border-line bg-bone p-10 text-center text-sm text-mist">
          Chưa kết nối được API.
        </p>
      ) : products.length === 0 ? (
        <p className="py-16 text-center text-mist">Danh mục chưa có sản phẩm.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
