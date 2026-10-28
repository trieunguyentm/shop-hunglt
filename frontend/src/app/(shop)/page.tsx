import { Hero } from '@/components/home/Hero';
import { Marquee } from '@/components/home/Marquee';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Story } from '@/components/home/Story';
import { PromoBanner } from '@/components/home/PromoBanner';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <CategoryGrid />
      {/* Server Component — gọi API sản phẩm mới */}
      <FeaturedProducts />
      <PromoBanner />
      <Story />
    </>
  );
}
