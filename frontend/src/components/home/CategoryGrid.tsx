import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/animation/Reveal';

const CATEGORIES = [
  { name: 'Áo', slug: 'ao', img: 'https://picsum.photos/seed/cat-ao/800/1000', span: 'lg:row-span-2' },
  { name: 'Quần', slug: 'quan', img: 'https://picsum.photos/seed/cat-quan/800/600', span: '' },
  { name: 'Đầm & Váy', slug: 'dam-vay', img: 'https://picsum.photos/seed/cat-dam/800/600', span: '' },
  { name: 'Phụ kiện', slug: 'phu-kien', img: 'https://picsum.photos/seed/cat-pk/800/600', span: 'lg:col-span-2' },
];

export function CategoryGrid() {
  return (
    <section id="collections" className="container-page py-24">
      <Reveal className="mb-12 flex items-end justify-between">
        <div>
          <p className="eyebrow mb-3">Danh mục</p>
          <h2 className="text-display-md max-w-md">Tủ đồ cho mọi khoảnh khắc</h2>
        </div>
        <Link href="/products" className="link-underline hidden text-sm text-graphite sm:block">
          Xem tất cả →
        </Link>
      </Reveal>

      <div className="grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat, i) => (
          <Reveal key={cat.slug} delay={i * 0.08} className={cat.span}>
            <Link
              href={`/category/${cat.slug}`}
              className="group relative block h-full w-full overflow-hidden rounded-xl2 bg-bone"
            >
              <Image
                src={cat.img}
                alt={cat.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 ease-silk group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/0 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <h3 className="font-display text-2xl text-ivory">{cat.name}</h3>
                <span className="text-sm text-ivory/80">Khám phá →</span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
