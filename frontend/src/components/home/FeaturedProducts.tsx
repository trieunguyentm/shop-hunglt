import { getProducts } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';
import { Reveal } from '@/components/animation/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import type { ProductListItem } from '@/lib/types';

/**
 * Server Component — lấy sản phẩm nổi bật từ API.
 * Nếu backend chưa chạy, hiển thị thông báo nhẹ nhàng thay vì lỗi trắng trang.
 */
export async function FeaturedProducts() {
  let products: ProductListItem[] = [];
  let apiDown = false;
  try {
    const res = await getProducts({ pageSize: 4, sort: 'newest' });
    products = res.data;
  } catch {
    apiDown = true;
  }

  return (
    <section className="container-page py-24">
      <Reveal className="mb-12 text-center">
        <p className="eyebrow mb-3">Tuyển chọn</p>
        <h2 className="text-display-md">Sản phẩm nổi bật</h2>
      </Reveal>

      {apiDown ? (
        <p className="rounded-xl2 border border-dashed border-line bg-bone p-10 text-center text-sm text-mist">
          Chưa kết nối được API. Hãy chạy backend & seed dữ liệu (xem README) để hiển thị sản phẩm.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}

      <div className="mt-14 text-center">
        <ButtonLink href="/products" variant="outline">
          Xem tất cả sản phẩm
        </ButtonLink>
      </div>
    </section>
  );
}
