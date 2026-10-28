import { getProducts } from '@/lib/api';
import { ProductGrid } from '@/components/product/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { WifiOff } from 'lucide-react';
import type { ProductListItem } from '@/lib/types';
import { SectionHeading } from './SectionHeading';

/**
 * Server Component — lấy sản phẩm mới nhất từ API.
 * Backend chưa chạy → hiển thị trạng thái nhẹ nhàng thay vì lỗi trắng trang.
 */
export async function FeaturedProducts({ title = 'Hàng mới về', eyebrow = 'Mới nhất' }: { title?: string; eyebrow?: string }) {
  let products: ProductListItem[] = [];
  let apiDown = false;
  try {
    products = (await getProducts({ pageSize: 8, sort: 'newest' })).data;
  } catch {
    apiDown = true;
  }

  return (
    <section className="container-page py-20">
      <SectionHeading eyebrow={eyebrow} title={title} href="/products" />
      {apiDown ? (
        <EmptyState icon={<WifiOff size={24} />} title="Chưa kết nối được máy chủ" description="Sản phẩm sẽ hiển thị khi hệ thống hoạt động trở lại." />
      ) : (
        <ProductGrid products={products} />
      )}
      <div className="mt-12 text-center sm:hidden">
        <ButtonLink href="/products" variant="outline">
          Xem tất cả sản phẩm
        </ButtonLink>
      </div>
    </section>
  );
}
