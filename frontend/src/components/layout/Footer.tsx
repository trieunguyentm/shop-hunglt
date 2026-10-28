import Link from 'next/link';
import { ArrowUpRight, Mail, MapPin, Phone, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { Email } from '@/components/ui/Email';
import { Logo } from './Logo';

const COLUMNS = [
  {
    title: 'Mua sắm',
    links: [
      { label: 'Tất cả sản phẩm', href: '/products' },
      { label: 'Áo', href: '/category/ao' },
      { label: 'Quần', href: '/category/quan' },
      { label: 'Đầm & Váy', href: '/category/dam-vay' },
      { label: 'Phụ kiện', href: '/category/phu-kien' },
    ],
  },
  {
    title: 'Khám phá',
    links: [
      { label: 'Bộ sưu tập', href: '/collections' },
      { label: 'Câu chuyện MAISON', href: '/#story' },
      { label: 'Tìm kiếm', href: '/search' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Liên hệ', href: '/contact' },
      { label: 'Đơn hàng của tôi', href: '/orders' },
      { label: 'Tài khoản', href: '/account' },
    ],
  },
];

const PERKS = [
  { icon: Truck, title: 'Giao toàn quốc', text: 'Nhận hàng trong 2–4 ngày' },
  { icon: RotateCcw, title: 'Đổi trả 30 ngày', text: 'Miễn phí, không cần lý do' },
  { icon: ShieldCheck, title: 'Thanh toán an toàn', text: 'COD hoặc QR qua PayOS' },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-white">
      {/* Cam kết dịch vụ */}
      <div className="border-b border-white/10">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-3">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lime-400 text-ink">
                <Icon size={20} />
              </span>
              <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="text-sm text-white/60">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Thời trang trẻ, tối giản và dễ phối — để mỗi ngày mặc đẹp mà không cần nghĩ nhiều.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-white/70">
              <li className="flex items-center gap-2.5"><Mail size={15} className="text-lime-400" /> <Email value="hello@maison.local" /></li>
              <li className="flex items-center gap-2.5"><Phone size={15} className="text-lime-400" /> 1900 0000</li>
              <li className="flex items-center gap-2.5"><MapPin size={15} className="text-lime-400" /> Hà Nội, Việt Nam</li>
            </ul>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="group inline-flex items-center gap-1 text-sm font-medium text-white/80 transition-colors hover:text-lime-400">
                      {l.label}
                      <ArrowUpRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} MAISON. Đồ án tốt nghiệp — Lại Tiến Hùng.</p>
          <p>Next.js · Express · Prisma · Keycloak</p>
        </div>
      </div>
    </footer>
  );
}
