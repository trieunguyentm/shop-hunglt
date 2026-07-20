import { auth } from '@/auth';

/**
 * Bảo vệ các route yêu cầu đăng nhập.
 *
 * Một phiên bị coi là KHÔNG hợp lệ khi:
 *  - chưa đăng nhập, hoặc
 *  - làm mới token thất bại (session.error = RefreshAccessTokenError), hoặc
 *  - không còn access token để gọi API.
 *
 * Cả ba trường hợp đều đưa người dùng về /login kèm callbackUrl để quay lại đúng
 * trang đang xem sau khi đăng nhập lại (thay vì hiển thị lỗi "access token hết hạn").
 */
export default auth((req) => {
  const session = req.auth;
  const invalid = !session || Boolean(session.error) || !session.accessToken;
  if (!invalid) return;

  const loginUrl = new URL('/login', req.nextUrl.origin);
  // Giữ nguyên cả query string (vd /orders?page=2)
  loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
  if (session?.error) loginUrl.searchParams.set('reason', 'session_expired');
  return Response.redirect(loginUrl);
});

export const config = {
  matcher: ['/account/:path*', '/cart/:path*', '/checkout/:path*', '/orders/:path*', '/admin/:path*'],
};
