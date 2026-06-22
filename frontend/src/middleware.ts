import { auth } from '@/auth';

// Bảo vệ các route yêu cầu đăng nhập. Chưa đăng nhập → chuyển tới trang đăng nhập Keycloak.
export default auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL('/api/auth/signin', req.nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ['/account/:path*', '/cart/:path*', '/checkout/:path*', '/orders/:path*', '/admin/:path*'],
};
