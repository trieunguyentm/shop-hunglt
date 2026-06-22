import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

const NAV = [
  { label: 'Tổng quan', href: '/admin' },
  { label: 'Sản phẩm', href: '/admin/products' },
  { label: 'Danh mục', href: '/admin/categories' },
  { label: 'Nhà cung cấp', href: '/admin/suppliers' },
  { label: 'Nhập kho', href: '/admin/stock' },
  { label: 'Khuyến mãi', href: '/admin/promotions' },
  { label: 'Đơn hàng', href: '/admin/orders' },
  { label: 'Khách hàng', href: '/admin/customers' },
  { label: 'Liên hệ', href: '/admin/contact' },
  { label: 'Tài khoản', href: '/admin/accounts' },
];

// Guard: chỉ ADMIN/STAFF mới vào được khu quản trị.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const roles = session?.roles ?? [];
  if (!roles.includes('ADMIN') && !roles.includes('STAFF')) {
    redirect('/');
  }

  return (
    <div className="container-page flex min-h-screen gap-8 pt-[calc(var(--header-h)+2rem)]">
      <aside className="hidden w-56 shrink-0 md:block">
        <p className="eyebrow mb-4">Quản trị</p>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-graphite transition-colors hover:bg-bone hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1 pb-20">{children}</section>
    </div>
  );
}
