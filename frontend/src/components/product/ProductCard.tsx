import Image from 'next/image';
import Link from 'next/link';
import { formatVND } from '@/lib/utils';
import type { ProductListItem } from '@/lib/types';

/** Thẻ sản phẩm — tỷ lệ ảnh 4:5 kiểu lookbook, hover đổi ảnh/nâng nhẹ. */
export function ProductCard({ product }: { product: ProductListItem }) {
  const primary = product.images?.[0]?.url ?? 'https://picsum.photos/seed/placeholder/800/1000';

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl2 bg-bone">
        <Image
          src={primary}
          alt={product.images?.[0]?.alt ?? product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 ease-silk group-hover:scale-105"
        />
      </div>
      <div className="mt-4 space-y-1">
        {product.category && <p className="eyebrow">{product.category.name}</p>}
        <h3 className="font-display text-lg leading-snug">{product.name}</h3>
        <p className="text-sm text-graphite">{formatVND(product.salePrice)}</p>
      </div>
    </Link>
  );
}
