import NextAuth, { customFetch } from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';

/**
 * Cấu hình Auth.js (NextAuth v5) với Keycloak provider.
 * Đọc biến môi trường: AUTH_KEYCLOAK_ID / AUTH_KEYCLOAK_SECRET / AUTH_KEYCLOAK_ISSUER / AUTH_SECRET.
 * Token (access/refresh) được lưu trong JWT của Auth.js; tự làm mới khi hết hạn.
 */

const ISSUER = process.env.AUTH_KEYCLOAK_ISSUER ?? 'http://localhost:8080/realms/fashion-shop';
const PUBLIC_ORIGIN = new URL(ISSUER).origin; // vd http://localhost:8080 (browser dùng)

// Khi chạy Docker: trình duyệt vẫn dùng issuer=localhost, nhưng SERVER phải gọi Keycloak
// qua URL nội bộ trong Docker network (vd http://keycloak:8080). Để trống ở local dev.
const INTERNAL_URL = process.env.KEYCLOAK_INTERNAL_URL;
const INTERNAL_ORIGIN = INTERNAL_URL ? new URL(INTERNAL_URL).origin : null;
const TOKEN_URL = `${INTERNAL_ORIGIN ?? PUBLIC_ORIGIN}${new URL(ISSUER).pathname}/protocol/openid-connect/token`;

/**
 * Auth.js v5 luôn gọi discovery/token/jwks theo `issuer` (bỏ qua wellKnown). Khi chạy Docker,
 * issuer=localhost không tới được từ trong container → ta chặn ở tầng fetch, viết lại
 * origin localhost → origin nội bộ (keycloak:8080) cho riêng các request server-side.
 */
const kcFetch: typeof fetch | undefined = INTERNAL_ORIGIN
  ? (input, init) => {
      const href =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const url = new URL(href);
      if (url.origin === PUBLIC_ORIGIN) {
        const internal = new URL(INTERNAL_ORIGIN);
        url.protocol = internal.protocol;
        url.host = internal.host;
      }
      return fetch(url, init);
    }
  : undefined;

/** Giải mã phần payload của JWT (base64url) — lấy realm_access.roles. */
function decodeRoles(accessToken?: string): string[] {
  if (!accessToken) return [];
  try {
    const payload = accessToken.split('.')[1];
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      ),
    ) as { realm_access?: { roles?: string[] } };
    return payload ? (json.realm_access?.roles ?? []) : [];
  } catch {
    return [];
  }
}

/** Làm mới access token bằng refresh token của Keycloak. */
async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.AUTH_KEYCLOAK_ID ?? '',
      client_secret: process.env.AUTH_KEYCLOAK_SECRET ?? '',
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error('refresh_failed');
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
}

const keycloakProvider = Keycloak({
  clientId: process.env.AUTH_KEYCLOAK_ID,
  clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
  issuer: ISSUER,
});
// Gắn customFetch (chỉ khi chạy Docker) để định tuyến request server-side sang Keycloak nội bộ.
if (kcFetch) {
  (keycloakProvider.options as unknown as Record<symbol, unknown>)[customFetch] = kcFetch;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [keycloakProvider],
  // Tin tưởng host (cần thiết khi chạy production `next start` sau proxy/localhost)
  trustHost: true,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account }) {
      // Lần đầu đăng nhập: lưu token từ provider
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at; // giây (epoch)
        token.roles = decodeRoles(account.access_token);
        return token;
      }

      // Còn hạn → dùng tiếp
      const expiresAt = (token.expiresAt as number | undefined) ?? 0;
      if (Date.now() < expiresAt * 1000 - 30_000) {
        return token;
      }

      // Hết hạn → làm mới
      try {
        const refreshed = await refreshAccessToken(token.refreshToken as string);
        token.accessToken = refreshed.access_token;
        token.expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in;
        if (refreshed.refresh_token) token.refreshToken = refreshed.refresh_token;
        token.roles = decodeRoles(refreshed.access_token);
      } catch {
        token.error = 'RefreshAccessTokenError';
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.roles = (token.roles as string[] | undefined) ?? [];
      session.error = token.error as string | undefined;
      return session;
    },
  },
});
