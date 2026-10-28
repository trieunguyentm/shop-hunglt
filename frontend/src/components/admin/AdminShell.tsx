'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  BadgePercent,
  Boxes,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu as MenuIcon,
  Package,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { federatedSignOut } from '@/lib/logout';
import { ROLE_LABEL } from '@/lib/orderStatus';
import { Avatar } from '@/components/ui/misc';
import { useBodyScrollLock } from '@/components/ui/Modal';
import { Logo } from '@/components/layout/Logo';

type Role = 'ADMIN' | 'STAFF';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Chỉ hiển thị cho các vai trò này (mặc định: ADMIN + STAFF). */
  roles?: Role[];
}

export const ADMIN_NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Tổng quan', items: [{ label: 'Bảng điều khiển', href: '/admin', icon: LayoutDashboard }] },
  {
    group: 'Bán hàng',
    items: [
      { label: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart },
      { label: 'Khách hàng', href: '/admin/customers', icon: Users },
      { label: 'Khuyến mãi', href: '/admin/promotions', icon: BadgePercent, roles: ['ADMIN'] },
      { label: 'Liên hệ', href: '/admin/contact', icon: Mail },
    ],
  },
  {
    group: 'Kho hàng',
    items: [
      { label: 'Sản phẩm', href: '/admin/products', icon: Package },
      { label: 'Danh mục', href: '/admin/categories', icon: FolderTree },
      { label: 'Nhà cung cấp', href: '/admin/suppliers', icon: Truck },
      { label: 'Nhập kho', href: '/admin/stock', icon: Boxes },
    ],
  },
  { group: 'Hệ thống', items: [{ label: 'Tài khoản', href: '/admin/accounts', icon: ShieldCheck, roles: ['ADMIN'] }] },
];

function SidebarContent({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const name = session?.user?.name ?? 'Quản trị';
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo light href="/admin" className="text-xl" />
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-lime-400">Admin</span>
      </div>

      <nav className="scrollbar-none flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((g) => {
          const items = g.items.filter((it) => !it.roles || it.roles.includes(role));
          if (!items.length) return null;
          return (
            <div key={g.group} className="mb-6">
              <p className="mb-2 px-3 text-2xs font-semibold uppercase tracking-[0.14em] text-white/40">{g.group}</p>
              <ul className="space-y-0.5">
                {items.map(({ label, href, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                          active ? 'bg-lime-400 text-ink' : 'text-white/70 hover:bg-white/5 hover:text-white',
                        )}
                      >
                        <Icon size={18} />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white">
          <Store size={18} /> Về cửa hàng
        </Link>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <Avatar name={name} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-white/50">{ROLE_LABEL[role]}</p>
          </div>
          <button onClick={() => void federatedSignOut()} aria-label="Đăng xuất" title="Đăng xuất" className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Khung khu quản trị: sidebar cố định (desktop) + thanh trên & drawer (mobile). */
export function AdminShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useBodyScrollLock(open);
  useEffect(() => setOpen(false), [pathname]);

  const current = ADMIN_NAV.flatMap((g) => g.items).find((it) => (it.href === '/admin' ? pathname === '/admin' : pathname.startsWith(it.href)));

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-ink lg:block">
        <SidebarContent role={role} />
      </aside>

      {/* Thanh trên — mobile/tablet */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur-xl lg:hidden">
        <button aria-label="Mở menu quản trị" onClick={() => setOpen(true)} className="-ml-1 grid h-10 w-10 place-items-center rounded-full hover:bg-muted">
          <MenuIcon size={20} />
        </button>
        <p className="truncate font-bold">{current?.label ?? 'Quản trị'}</p>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] animate-slide-in-left bg-ink">
            <button aria-label="Đóng menu" onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full text-white/70 hover:bg-white/10">
              <X size={18} />
            </button>
            <SidebarContent role={role} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
