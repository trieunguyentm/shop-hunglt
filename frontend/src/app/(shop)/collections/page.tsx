import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, WifiOff } from 'lucide-react';
import { getCategories } from '@/lib/api';
import { Reveal } from '@/components/animation/Reveal';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { SITE_IMAGES, categoryImage } from '@/lib/images';
import type { Category } from '@/lib/types';

export const metadata = {
  title: 'Bộ sưu tập',
  description: 'Các bộ sưu tập thời trang MAISON — tuyển chọn theo mùa và phong cách.',
};

export default async function CollectionsPage() {
  let categories: Category[] = [];
  let apiDown = false;
  try {
    categories = (await getCategories()).data;
  } catch {
    apiDown = true;
  }

  return (
    <div className="page-top">
      <section className="container-page">
        <div className="relative h-[52vh] min-h-[360px] overflow-hidden rounded-[2rem] bg-ink">
          <Image src={SITE_IMAGES.collections} alt="Cửa hàng MAISON với giá treo áo len và áo khoác" fill priority sizes="100vw" className="object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-12">
            <Reveal>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-lime-400">Thu — Đông 2026</p>
              <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">Bộ sưu tập tuyển chọn</h1>
              <p className="mt-4 max-w-lg text-white/80">Mỗi danh mục là một tủ đồ thu nhỏ — chọn nhanh, phối dễ, mặc được lâu.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        {apiDown ? (
          <EmptyState icon={<WifiOff size={24} />} title="Chưa kết nối được máy chủ" description="Bộ sưu tập sẽ hiển thị khi hệ thống hoạt động trở lại." />
        ) : (
          <div className="space-y-6">
            {categories.map((cat, i) => (
              <Reveal key={cat.id}>
                <Link
                  href={`/category/${cat.slug}`}
                  className={cn(
                    'group grid overflow-hidden rounded-[2rem] bg-surface shadow-soft transition-shadow hover:shadow-pop md:grid-cols-2',
                    i % 2 === 1 && 'md:[&>*:first-child]:order-2',
                  )}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted md:aspect-auto md:min-h-[360px]">
                    <Image src={categoryImage(cat.slug)} alt={cat.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-700 ease-silk group-hover:scale-105" />
                  </div>
                  <div className="flex flex-col justify-center p-7 sm:p-12">
                    <p className="text-6xl font-extrabold text-line-strong">0{i + 1}</p>
                    <h2 className="heading-2 mt-2">{cat.name}</h2>
                    {cat.description && <p className="mt-3 max-w-md text-ink-2">{cat.description}</p>}
                    <p className="mt-2 text-sm text-ink-3">{cat._count?.products ?? 0} sản phẩm</p>
                    <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold">
                      <span className="link-underline">Khám phá {cat.name}</span>
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-lime-400 transition-transform group-hover:translate-x-1">
                        <ArrowRight size={16} />
                      </span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <FeaturedProducts eyebrow="Đừng bỏ lỡ" title="Món mới lên kệ" />
    </div>
  );
}
