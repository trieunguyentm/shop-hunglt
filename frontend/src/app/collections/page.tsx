import Image from 'next/image';
import Link from 'next/link';
import { getCategories } from '@/lib/api';
import { Reveal } from '@/components/animation/Reveal';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Category } from '@/lib/types';

export const metadata = {
  title: 'Bộ sưu tập',
  description: 'Các bộ sưu tập thời trang MAISON — tuyển chọn theo mùa và phong cách.',
};

export default async function CollectionsPage() {
  let categories: Category[] = [];
  try {
    categories = (await getCategories()).data;
  } catch {
    categories = [];
  }

  return (
    <div className="pt-[var(--header-h)]">
      {/* Hero lookbook */}
      <section className="relative h-[70vh] overflow-hidden">
        <Image
          src="https://picsum.photos/seed/maison-collections/1800/1200"
          alt="Bộ sưu tập MAISON"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
        <div className="container-page absolute inset-x-0 bottom-0 pb-14">
          <Reveal>
            <p className="eyebrow mb-3 text-ivory/80">Xuân — Hè 2026</p>
            <h1 className="max-w-2xl text-display-lg text-ivory">
              Bộ sưu tập <span className="italic">tuyển chọn</span>
            </h1>
            <p className="mt-4 max-w-lg text-ivory/85">
              Những đường nét tối giản, chất liệu tự nhiên — mỗi bộ sưu tập kể một câu chuyện
              về sự thanh lịch vượt thời gian.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Các bộ sưu tập theo danh mục — bố cục editorial xen kẽ */}
      <section className="container-page py-24">
        {categories.length === 0 ? (
          <p className="rounded-xl2 border border-dashed border-line bg-bone p-10 text-center text-sm text-mist">
            Chưa kết nối được API danh mục. Hãy chạy backend để hiển thị bộ sưu tập.
          </p>
        ) : (
          <div className="space-y-24">
            {categories.map((cat, i) => (
              <Reveal
                key={cat.id}
                className={cn(
                  'grid items-center gap-8 lg:grid-cols-2 lg:gap-16',
                  i % 2 === 1 && 'lg:[&>*:first-child]:order-2',
                )}
              >
                <Link
                  href={`/category/${cat.slug}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-xl2 bg-bone"
                >
                  <Image
                    src={`https://picsum.photos/seed/collection-${cat.slug}/1000/800`}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-silk group-hover:scale-105"
                  />
                </Link>
                <div>
                  <p className="eyebrow mb-3">Bộ sưu tập 0{i + 1}</p>
                  <h2 className="text-display-md">{cat.name}</h2>
                  {cat.description && (
                    <p className="mt-4 max-w-md leading-relaxed text-graphite">{cat.description}</p>
                  )}
                  <p className="mt-2 text-sm text-mist">
                    {cat._count?.products ?? 0} sản phẩm
                  </p>
                  <div className="mt-7">
                    <ButtonLink href={`/category/${cat.slug}`} variant="outline">
                      Khám phá {cat.name}
                    </ButtonLink>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Sản phẩm nổi bật */}
      <FeaturedProducts />
    </div>
  );
}
