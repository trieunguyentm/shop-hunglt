'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Các khu vực bắt buộc đăng nhập (khớp matcher trong middleware.ts).
const PROTECTED = ['/account', '/cart', '/checkout', '/orders', '/admin'];

/**
 * Khi làm mới token thất bại, Auth.js gắn session.error = 'RefreshAccessTokenError'.
 * Middleware chỉ chạy khi có điều hướng thật; với điều hướng phía client (SPA) hoặc
 * khi người dùng để tab mở lâu, phiên có thể chết ngay trên trang đang xem.
 * Thành phần này theo dõi và đưa người dùng về /login thay vì để các lời gọi API
 * lần lượt trả 401 rồi hiển thị lỗi thô.
 */
export function SessionGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  useEffect(() => {
    if (status === 'loading') return;

    const onProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'));

    // Phiên chết theo hai kiểu:
    //  - còn cookie nhưng làm mới token thất bại  → session.error
    //  - mất hẳn session (cookie hết hạn/đăng xuất ở tab khác) → unauthenticated
    // Kiểu thứ hai quan trọng với điều hướng SPA: middleware không chạy, nếu bỏ qua
    // thì trang sẽ kẹt ở trạng thái "Đang tải..." vì không có access token.
    const expired = status === 'authenticated' && Boolean(session?.error);
    const signedOut = status === 'unauthenticated';
    const dead = expired || (signedOut && onProtected);
    if (!dead || redirected.current) return;

    redirected.current = true;

    if (onProtected) {
      const cb = encodeURIComponent(pathname);
      const reason = expired ? '&reason=session_expired' : '';
      router.replace(`/login?callbackUrl=${cb}${reason}`);
    } else {
      // Trang công khai: chỉ cần làm mới để header hiển thị đúng trạng thái đăng xuất.
      router.refresh();
    }
  }, [status, session?.error, pathname, router]);

  return null;
}
