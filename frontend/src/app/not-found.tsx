import { ButtonLink } from '@/components/ui/Button';
import { Logo } from '@/components/layout/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="container-page flex h-[var(--header-h)] items-center">
        <Logo />
      </div>
      <div className="container-page flex flex-1 flex-col items-center justify-center pb-24 text-center">
        <p className="text-[120px] font-extrabold leading-none tracking-tightest sm:text-[180px]">
          4<span className="text-brand-500">0</span>4
        </p>
        <h1 className="heading-2 mt-2">
          Trang này đã <span className="mark-lime">“out of stock”</span>
        </h1>
        <p className="mt-3 max-w-md text-ink-2">Trang bạn tìm có thể đã bị xóa hoặc không tồn tại. Quay lại mua sắm tiếp nhé!</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">Về trang chủ</ButtonLink>
          <ButtonLink href="/products" variant="outline">Xem sản phẩm</ButtonLink>
        </div>
      </div>
    </div>
  );
}
