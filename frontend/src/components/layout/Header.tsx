'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Package,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { federatedSignOut } from '@/lib/logout';
import { useCartStore } from '@/lib/stores/cart';
import { ROLE_LABEL } from '@/lib/orderStatus';
import { Avatar } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { useBodyScrollLock } from '@/components/ui/Modal';
import { Logo } from './Logo';

const NAV = [
  { label: 'Cửa hàng', href: '/products' },
  { label: 'Áo', href: '/category/ao' },
  { label: 'Quần', href: '/category/quan' },
  { label: 'Đầm & Váy', href: '/category/dam-vay' },
  { label: 'Phụ kiện', href: '/category/phu-kien' },
  { label: 'Bộ sưu tập', href: '/collections' },
];

// Drawer mobile có thêm trang Liên hệ
const MOBILE_NAV = [...NAV, { label: 'Liên hệ', href: '/contact' }];

const ANNOUNCEMENTS = ['Đổi trả miễn phí trong 30 ngày', 'Nhập WELCOME10 giảm 10% cho đơn từ 300K', 'Giao hàng toàn quốc 2–4 ngày'];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthed = status === 'authenticated';
  const roles = session?.roles ?? [];
  const isStaff = roles.includes('ADMIN') || roles.includes('STAFF');
  const roleKey = roles.includes('ADMIN') ? 'ADMIN' : roles.includes('STAFF') ? 'STAFF' : 'CUSTOMER';
  const cartCount = useCartStore((s) => s.count);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState('');
  const [announce, setAnnounce] = useState(0);
  useBodyScrollLock(mobileOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Xoay vòng câu thông báo
  useEffect(() => {
    const t = setInterval(() => setAnnounce((i) => (i + 1) % ANNOUNCEMENTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Đóng drawer khi chuyển trang
  useEffect(() => setMobileOpen(false), [pathname]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : '/search');
  }

  const userName = session?.user?.name ?? 'Tài khoản';

  return (
    <>
      {/* Thanh thông báo */}
      <div className="bg-ink text-white">
        <div className="container-page flex h-9 items-center justify-center text-xs font-medium">
          <p key={announce} className="animate-fade-up">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-lime-400 align-middle" />
            {ANNOUNCEMENTS[announce]}
          </p>
        </div>
      </div>

      <header
        className={cn(
          'sticky top-0 z-50 border-b bg-canvas/95 backdrop-blur-xl transition-[border-color,box-shadow] duration-300',
          scrolled ? 'border-line shadow-[0_1px_0_rgba(0,0,0,0.02)]' : 'border-transparent',
        )}
      >
        <nav className="container-page flex h-[var(--header-h)] items-center gap-4 lg:gap-6">
          <button
            className="-ml-2 grid h-10 w-10 place-items-center rounded-full hover:bg-muted lg:hidden"
            aria-label="Mở menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon size={22} />
          </button>

          <Logo />

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={cn(
                      'whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
                      active ? 'bg-ink text-white' : 'text-ink-2 hover:bg-muted hover:text-ink',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {/* Tìm kiếm — ô nhập trên desktop, icon trên mobile */}
            <form onSubmit={submitSearch} className="relative hidden xl:block" role="search">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm sản phẩm..."
                aria-label="Tìm kiếm sản phẩm"
                className="h-10 w-52 rounded-full border border-transparent bg-muted pl-10 pr-4 text-sm outline-none transition-all duration-300 placeholder:text-ink-3 focus:w-64 focus:border-ink focus:bg-surface"
              />
            </form>
            <Link href="/search" aria-label="Tìm kiếm" className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted xl:hidden">
              <Search size={20} />
            </Link>

            {status === 'loading' ? (
              <span className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            ) : isAuthed ? (
              <Menu
                width={256}
                header={
                  <div className="mb-1.5 flex items-center gap-3 rounded-xl bg-canvas p-3">
                    <Avatar name={userName} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{userName}</p>
                      <p className="truncate text-xs text-ink-3">{ROLE_LABEL[roleKey]}</p>
                    </div>
                  </div>
                }
                items={[
                  { label: 'Tài khoản của tôi', icon: <User size={16} />, href: '/account' },
                  { label: 'Đơn hàng của tôi', icon: <Package size={16} />, href: '/orders' },
                  ...(isStaff ? [{ label: 'Khu quản trị', icon: <LayoutDashboard size={16} />, href: '/admin' }] : []),
                  { type: 'separator' as const },
                  { label: 'Đăng xuất', icon: <LogOut size={16} />, danger: true, onSelect: () => void federatedSignOut() },
                ]}
                trigger={(p) => (
                  <button {...p} aria-label="Menu tài khoản" className="rounded-full p-0.5 transition-shadow hover:shadow-ring">
                    <Avatar name={userName} size={36} />
                  </button>
                )}
              />
            ) : (
              <Button size="sm" variant="ghost" className="hidden sm:inline-flex" leftIcon={<User size={16} />} onClick={() => signIn('keycloak')}>
                Đăng nhập
              </Button>
            )}
            {!isAuthed && status !== 'loading' && (
              <button aria-label="Đăng nhập" onClick={() => signIn('keycloak')} className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted sm:hidden">
                <User size={20} />
              </button>
            )}

            <Link
              href="/cart"
              aria-label={`Giỏ hàng (${cartCount})`}
              className="relative grid h-10 w-10 place-items-center rounded-full bg-ink text-white transition-transform hover:scale-105"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-lime-400 px-1 text-2xs font-bold text-ink ring-2 ring-canvas">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </nav>
      </header>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-slide-in-left flex-col bg-canvas shadow-pop">
            <div className="flex h-[var(--header-h)] items-center justify-between border-b border-line px-5">
              <Logo />
              <button aria-label="Đóng menu" onClick={() => setMobileOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              {isAuthed && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-soft">
                  <Avatar name={userName} size={44} />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{userName}</p>
                    <p className="text-xs text-ink-3">{ROLE_LABEL[roleKey]}</p>
                  </div>
                </div>
              )}
              <p className="eyebrow mb-2">Mua sắm</p>
              <ul className="mb-6 space-y-1">
                {MOBILE_NAV.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} onClick={() => setMobileOpen(false)} className={cn('block rounded-xl px-3 py-3 text-base font-semibold hover:bg-muted', isActive(pathname, item.href) ? 'bg-muted text-ink' : 'text-ink-2')}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="eyebrow mb-2">Tài khoản</p>
              <ul className="space-y-1">
                {isAuthed ? (
                  <>
                    <li><Link href="/account" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-muted"><User size={18} /> Tài khoản của tôi</Link></li>
                    <li><Link href="/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-muted"><Package size={18} /> Đơn hàng của tôi</Link></li>
                    {isStaff && (
                      <li><Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold text-brand-600 hover:bg-muted"><LayoutDashboard size={18} /> Khu quản trị</Link></li>
                    )}
                  </>
                ) : (
                  <li><Link href="/register" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 font-semibold hover:bg-muted"><User size={18} /> Tạo tài khoản</Link></li>
                )}
              </ul>
            </div>

            <div className="border-t border-line p-5">
              {isAuthed ? (
                <Button variant="outline" block leftIcon={<LogOut size={16} />} onClick={() => void federatedSignOut()}>
                  Đăng xuất
                </Button>
              ) : (
                <Button block onClick={() => signIn('keycloak')}>
                  Đăng nhập
                </Button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
