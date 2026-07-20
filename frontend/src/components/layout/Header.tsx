'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { federatedSignOut } from '@/lib/logout';
import { LogOut, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/stores/cart';

const NAV = [
  { label: 'Sản phẩm', href: '/products' },
  { label: 'Bộ sưu tập', href: '/collections' },
  { label: 'Câu chuyện', href: '/#story' },
  { label: 'Liên hệ', href: '/contact' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAuthed = status === 'authenticated';
  const roles = session?.roles ?? [];
  const isStaff = roles.includes('ADMIN') || roles.includes('STAFF');
  const cartCount = useCartStore((s) => s.count);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Khóa cuộn nền khi mở drawer
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-silk',
        scrolled || mobileOpen ? 'bg-ivory/90 backdrop-blur-md border-b border-line' : 'bg-transparent',
      )}
    >
      <nav className="container-page flex h-[var(--header-h)] items-center justify-between">
        {/* Hamburger (mobile) */}
        <button
          className="md:hidden"
          aria-label="Mở menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
        </button>

        <Link href="/" className="font-display text-2xl tracking-tight md:order-first">
          MAISON<span className="text-clay">.</span>
        </Link>

        <ul className="hidden items-center gap-9 md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="link-underline text-sm text-graphite hover:text-ink">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-5 text-ink">
          <Link href="/search" aria-label="Tìm kiếm" className="transition-colors hover:text-clay">
            <Search size={19} strokeWidth={1.5} />
          </Link>

          {isStaff && (
            <Link href="/admin" className="hidden text-sm text-graphite hover:text-clay sm:block">
              Quản trị
            </Link>
          )}

          {isAuthed ? (
            <>
              <Link href="/account" aria-label="Tài khoản" className="transition-colors hover:text-clay" title={session?.user?.name ?? 'Tài khoản'}>
                <User size={19} strokeWidth={1.5} />
              </Link>
              <button aria-label="Đăng xuất" onClick={() => void federatedSignOut()} className="hidden transition-colors hover:text-clay sm:block">
                <LogOut size={19} strokeWidth={1.5} />
              </button>
            </>
          ) : (
            <button aria-label="Đăng nhập" onClick={() => signIn('keycloak')} className="transition-colors hover:text-clay">
              <User size={19} strokeWidth={1.5} />
            </button>
          )}

          <Link href="/cart" aria-label="Giỏ hàng" className="relative transition-colors hover:text-clay">
            <ShoppingBag size={19} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full bg-clay text-[10px] text-ivory">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Drawer mobile */}
      <div
        className={cn(
          'overflow-hidden border-t border-line bg-ivory transition-[max-height] duration-500 ease-silk md:hidden',
          mobileOpen ? 'max-h-96' : 'max-h-0 border-t-0',
        )}
      >
        <ul className="container-page flex flex-col gap-1 py-4">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-base text-graphite hover:text-ink"
              >
                {item.label}
              </Link>
            </li>
          ))}
          {isStaff && (
            <li>
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="block py-2 text-base text-clay">
                Khu quản trị
              </Link>
            </li>
          )}
          {isAuthed && (
            <li>
              <button onClick={() => { setMobileOpen(false); void federatedSignOut(); }} className="py-2 text-base text-graphite hover:text-ink">
                Đăng xuất
              </button>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
}
