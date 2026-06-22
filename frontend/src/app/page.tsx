import { Hero } from '@/components/home/Hero';
import { Marquee } from '@/components/home/Marquee';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Story } from '@/components/home/Story';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <CategoryGrid />
      <Story />
      {/* Server Component — gọi API. Suspense bao quanh để không chặn phần còn lại. */}
      <FeaturedProducts />
    </>
  );
}
