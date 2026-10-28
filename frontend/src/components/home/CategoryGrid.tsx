import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/animation/Reveal';
import { categoryImage } from '@/lib/images';
import { SectionHeading } from './SectionHeading';

const CATEGORIES = [
  { name: 'Áo', slug: 'ao', note: 'Thun, sơ mi, khoác', span: 'row-span-2' },
  { name: 'Quần', slug: 'quan', note: 'Jean, kaki, short', span: '' },
  { name: 'Đầm & Váy', slug: 'dam-vay', note: 'Đầm, chân váy', span: '' },
  { name: 'Phụ kiện', slug: 'phu-kien', note: 'Túi, thắt lưng, mũ', span: 'col-span-2' },
];

export function CategoryGrid() {
  return (
    <section className="container-page py-20">
      <SectionHeading eyebrow="Danh mục" title="Tìm đúng món bạn cần" href="/products" />
      <div className="grid auto-rows-[200px] grid-cols-2 gap-3 sm:auto-rows-[240px] sm:gap-4 lg:grid-cols-3">
        {CATEGORIES.map((cat, i) => (
          <Reveal key={cat.slug} delay={i * 0.06} className={cat.span}>
            <Link href={`/category/${cat.slug}`} className="group relative block h-full w-full overflow-hidden rounded-3xl bg-muted">
              <Image
                src={categoryImage(cat.slug)}
                alt={cat.name}
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-silk group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5">
                <div>
                  <h3 className="text-xl font-extrabold text-white sm:text-2xl">{cat.name}</h3>
                  <p className="text-xs text-white/80 sm:text-sm">{cat.note}</p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink transition-colors group-hover:bg-lime-400">
                  <ArrowUpRight size={18} />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
