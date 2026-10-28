import Image from 'next/image';
import { SITE_IMAGES } from '@/lib/images';

/** Khung trang xác thực: form bên trái, ảnh thương hiệu bên phải (ẩn trên mobile). */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page page-top">
      <div className="grid overflow-hidden rounded-[2rem] bg-surface shadow-soft lg:grid-cols-2">
        <div className="flex items-center justify-center px-5 py-12 sm:px-12 sm:py-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <div className="relative hidden min-h-[600px] bg-muted lg:block">
          <Image src={SITE_IMAGES.auth} alt="Người mẫu MAISON" fill sizes="50vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
          <div className="absolute inset-x-10 bottom-10 text-white">
            <p className="text-3xl font-extrabold leading-tight tracking-tight">
              Mặc đẹp mỗi ngày,
              <br />
              <span className="text-lime-400">không cần nghĩ nhiều.</span>
            </p>
            <p className="mt-3 text-sm text-white/80">Theo dõi đơn hàng, lưu giỏ hàng và nhận ưu đãi thành viên.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
