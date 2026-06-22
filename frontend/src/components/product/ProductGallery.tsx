'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ProductImage } from '@/lib/types';

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const fallback = 'https://picsum.photos/seed/placeholder/800/1000';
  const list = images.length ? images : [{ id: 'x', url: fallback, alt: name, isPrimary: true }];
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {/* Thumbnails */}
      {list.length > 1 && (
        <div className="flex gap-3 lg:flex-col">
          {list.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={cn(
                'relative h-20 w-16 overflow-hidden rounded-lg border transition-colors',
                i === active ? 'border-ink' : 'border-line hover:border-mist',
              )}
              aria-label={`Ảnh ${i + 1}`}
            >
              <Image src={img.url} alt={img.alt ?? name} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Main */}
      <div className="relative aspect-[4/5] flex-1 overflow-hidden rounded-xl2 bg-bone">
        <Image
          src={list[active].url}
          alt={list[active].alt ?? name}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
