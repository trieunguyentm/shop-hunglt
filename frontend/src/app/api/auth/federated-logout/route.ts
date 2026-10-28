import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

/**
 * Trả về URL đăng xuất của Keycloak (end_session_endpoint) kèm id_token_hint.
 *
 * Vì sao cần: signOut() của Auth.js chỉ xoá cookie phía ứng dụng; phiên SSO trên
 * Keycloak vẫn còn, nên bấm "Đăng nhập" lại sẽ vào thẳng mà không hỏi mật khẩu.
 * id_token được đọc ở phía server để không phải phơi ra client.
 */
export async function GET(req: NextRequest) {
  const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER ?? process.env.AUTH_KEYCLOAK_ISSUER;
  // Sau Docker/reverse proxy, req.nextUrl.origin là địa chỉ nội bộ (vd :3000 trong container)
  // → ưu tiên URL public đã cấu hình để Keycloak chuyển người dùng về đúng site.
  const origin = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? req.nextUrl.origin).replace(/\/$/, '');

  if (!issuer) {
    // Không cấu hình issuer → cứ đăng xuất cục bộ, về trang chủ.
    return NextResponse.json({ url: origin });
  }

  // Auth.js v5 đặt cookie "authjs.session-token", có tiền tố "__Secure-" khi chạy HTTPS.
  // Sau reverse proxy, protocol nhìn thấy có thể là http dù cookie vẫn mang tiền tố,
  // nên thử cả hai biến thể thay vì đoán theo protocol.
  const secret = process.env.AUTH_SECRET;
  let token = null;
  for (const secureCookie of [true, false]) {
    token = await getToken({ req, secret, secureCookie });
    if (token) break;
  }

  const url = new URL(`${issuer.replace(/\/$/, '')}/protocol/openid-connect/logout`);
  url.searchParams.set('post_logout_redirect_uri', origin);
  if (token?.idToken) {
    url.searchParams.set('id_token_hint', token.idToken as string);
  } else if (process.env.AUTH_KEYCLOAK_ID) {
    // Không có id_token thì Keycloak chấp nhận client_id thay thế
    url.searchParams.set('client_id', process.env.AUTH_KEYCLOAK_ID);
  }

  return NextResponse.json({ url: url.toString() });
}
