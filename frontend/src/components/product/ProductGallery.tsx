'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PLACEHOLDER_IMAGE } from '@/lib/images';
import type { ProductImage } from '@/lib/types';

/** Bộ ảnh sản phẩm: ảnh lớn + dải ảnh nhỏ (dọc trên desktop, ngang trên mobile). */
export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const list = images.length ? images : [{ id: 'placeholder', url: PLACEHOLDER_IMAGE, alt: name, isPrimary: true }];
  const [active, setActive] = useState(0);
  const current = list[Math.min(active, list.length - 1)];

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row lg:gap-4">
      {list.length > 1 && (
        <div className="scrollbar-none flex gap-2.5 overflow-x-auto lg:flex-col">
          {list.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Xem ảnh ${i + 1}`}
              aria-current={i === active}
              className={cn(
                'relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-muted ring-2 ring-offset-2 ring-offset-canvas transition-all',
                i === active ? 'ring-ink' : 'ring-transparent opacity-70 hover:opacity-100',
              )}
            >
              <Image src={img.url} alt={img.alt ?? name} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-3xl bg-muted">
        <Image
          key={current.id}
          src={current.url}
          alt={current.alt ?? name}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="animate-fade-in object-cover"
          priority
        />
      </div>
    </div>
  );
}
