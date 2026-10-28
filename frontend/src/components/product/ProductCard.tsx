import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { formatVND } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/images';
import type { ProductListItem } from '@/lib/types';

/** Thẻ sản phẩm — ảnh 4:5, nhãn danh mục, hover phóng ảnh + hiện nút "Xem chi tiết". */
export function ProductCard({ product, priority }: { product: ProductListItem; priority?: boolean }) {
  const img = product.images?.[0];

  return (
    <Link href={`/products/${product.slug}`} className="group block focus-visible:rounded-2xl">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
        <Image
          src={img?.url ?? PLACEHOLDER_IMAGE}
          alt={img?.alt ?? product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 ease-silk group-hover:scale-[1.04]"
        />
        {product.category && (
          <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider text-ink backdrop-blur">
            {product.category.name}
          </span>
        )}
        <span className="absolute bottom-3 right-3 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-lime-400 text-ink opacity-0 shadow-soft transition-all duration-300 ease-silk group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight size={18} />
        </span>
      </div>
      <div className="mt-3 space-y-1 px-0.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink sm:text-base">{product.name}</h3>
        <p className="text-sm font-bold text-ink sm:text-base">{formatVND(product.salePrice)}</p>
      </div>
    </Link>
  );
}

/** Lưới sản phẩm chuẩn: 2 cột mobile → 3 → 4 cột desktop. */
export function ProductGrid({ products, priorityCount = 0 }: { products: ProductListItem[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
