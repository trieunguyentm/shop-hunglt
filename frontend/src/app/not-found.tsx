import { ButtonLink } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-screen flex-col items-center justify-center pt-[var(--header-h)] text-center">
      <p className="eyebrow mb-4">Lỗi 404</p>
      <h1 className="text-display-lg">Không tìm thấy trang</h1>
      <p className="mt-4 max-w-md text-graphite">
        Trang bạn tìm có thể đã bị xóa hoặc không tồn tại. Hãy quay lại trang chủ hoặc tiếp tục mua sắm.
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/">Về trang chủ</ButtonLink>
        <ButtonLink href="/products" variant="outline">Xem sản phẩm</ButtonLink>
      </div>
    </div>
  );
}
