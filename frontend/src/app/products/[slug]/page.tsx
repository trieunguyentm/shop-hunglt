import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/api';
import { formatVND } from '@/lib/utils';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchase } from '@/components/product/ProductPurchase';
import { ProductReviews } from '@/components/product/ProductReviews';
import type { ProductDetail } from '@/lib/types';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const { data } = await getProductBySlug(params.slug);
    return { title: `${data.name} — MAISON` };
  } catch {
    return { title: 'Sản phẩm — MAISON' };
  }
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-gold" aria-label={`${rating} sao`}>
      {'★'.repeat(rating)}
      <span className="text-line">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

export default async function ProductDetailPage({ params }: PageProps) {
  const res = await getProductBySlug(params.slug).catch(() => null);
  if (!res) notFound();
  const product: ProductDetail = res.data;

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0;

  return (
    <div className="container-page pt-[calc(var(--header-h)+2.5rem)]">
      <nav className="mb-8 text-sm text-mist">
        <Link href="/products" className="link-underline">
          Sản phẩm
        </Link>
        {product.category && <span> / {product.category.name}</span>}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          {product.category && <p className="eyebrow mb-3">{product.category.name}</p>}
          <h1 className="text-display-md">{product.name}</h1>
          <p className="mt-4 font-display text-2xl text-clay">{formatVND(product.salePrice)}</p>

          {product.reviews.length > 0 && (
            <p className="mt-2 text-sm text-graphite">
              <Stars rating={Math.round(avgRating)} /> · {product.reviews.length} đánh giá
            </p>
          )}

          {product.description && (
            <p className="mt-6 leading-relaxed text-graphite">{product.description}</p>
          )}
          {product.material && (
            <p className="mt-2 text-sm text-mist">Chất liệu: {product.material}</p>
          )}

          <div className="mt-8">
            <ProductPurchase product={product} />
          </div>
        </div>
      </div>

      {/* Đánh giá (list + form) */}
      <ProductReviews productId={product.id} />
    </div>
  );
}
