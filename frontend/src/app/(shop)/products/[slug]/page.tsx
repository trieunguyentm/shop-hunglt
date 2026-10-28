import { notFound } from 'next/navigation';
import { RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { getProductBySlug, getProducts } from '@/lib/api';
import { formatVND } from '@/lib/utils';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchase } from '@/components/product/ProductPurchase';
import { ProductReviews } from '@/components/product/ProductReviews';
import { ProductGrid } from '@/components/product/ProductCard';
import { Breadcrumb, Rating } from '@/components/ui/misc';
import { Badge } from '@/components/ui/Badge';
import type { ProductDetail, ProductListItem } from '@/lib/types';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const { data } = await getProductBySlug(params.slug);
    return { title: data.name, description: data.description ?? undefined, openGraph: { images: data.images[0]?.url } };
  } catch {
    return { title: 'Sản phẩm' };
  }
}

const PERKS = [
  { icon: Truck, text: 'Giao hàng toàn quốc, phí 30.000đ' },
  { icon: RotateCcw, text: 'Đổi trả miễn phí trong 30 ngày' },
  { icon: ShieldCheck, text: 'Kiểm tra hàng trước khi thanh toán (COD)' },
];

export default async function ProductDetailPage({ params }: PageProps) {
  const res = await getProductBySlug(params.slug).catch(() => null);
  if (!res) notFound();
  const product: ProductDetail = res.data;

  // Gợi ý cùng danh mục (bỏ chính nó)
  let related: ProductListItem[] = [];
  if (product.category) {
    related = await getProducts({ category: product.category.slug, pageSize: 5 })
      .then((r) => r.data.filter((p) => p.id !== product.id).slice(0, 4))
      .catch(() => []);
  }

  const avgRating = product.reviews.length ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length : 0;
  const soldOut = product.stock <= 0 || product.variants.every((v) => v.stock <= 0);

  return (
    <div className="container-page page-top">
      <Breadcrumb
        className="mb-6"
        items={[
          { label: 'Cửa hàng', href: '/products' },
          ...(product.category ? [{ label: product.category.name, href: `/category/${product.category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            {product.category && <Badge>{product.category.name}</Badge>}
            {soldOut && <Badge tone="danger">Hết hàng</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{product.name}</h1>

          {product.reviews.length > 0 && (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm text-ink-2 hover:text-ink">
              <Rating value={avgRating} size={15} />
              <span className="font-semibold">{avgRating.toFixed(1)}</span>
              <span className="text-ink-3">({product.reviews.length} đánh giá)</span>
            </a>
          )}

          <p className="mt-5 text-3xl font-extrabold text-brand-600">{formatVND(product.salePrice)}</p>

          {product.description && <p className="mt-5 leading-relaxed text-ink-2">{product.description}</p>}
          {product.material && (
            <p className="mt-3 text-sm">
              <span className="text-ink-3">Chất liệu: </span>
              <span className="font-semibold">{product.material}</span>
            </p>
          )}

          <div className="my-7 h-px bg-line" />
          <ProductPurchase product={product} />

          <ul className="mt-8 space-y-3 rounded-2xl bg-muted p-5">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-ink-2">
                <Icon size={18} className="shrink-0 text-ink" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ProductReviews productId={product.id} />

      {related.length > 0 && (
        <section className="mt-20">
          <p className="eyebrow mb-2">Có thể bạn thích</p>
          <h2 className="heading-2 mb-8">Sản phẩm tương tự</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
