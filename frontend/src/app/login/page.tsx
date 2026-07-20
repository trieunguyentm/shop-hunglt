import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LoginActions } from '@/components/account/LoginActions';

export const metadata = { title: 'Đăng nhập — MAISON' };

// Chỉ chấp nhận đường dẫn nội bộ để tránh open redirect (//evil.com, https://evil.com).
function safeCallback(raw?: string): string {
  if (!raw) return '/account';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/account';
  return raw;
}

// Đăng nhập được xử lý bởi Keycloak (OIDC). Trang này là cửa ngõ chuyển hướng.
export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string; reason?: string };
}) {
  const callbackUrl = safeCallback(searchParams?.callbackUrl);
  const expired = searchParams?.reason === 'session_expired';

  // Đã đăng nhập và phiên còn hiệu lực → không cần ở lại trang này.
  const session = await auth();
  if (session?.accessToken && !session.error) {
    redirect(callbackUrl);
  }

  return (
    <div className="container-page flex min-h-screen items-center justify-center pt-[var(--header-h)]">
      <div className="w-full max-w-sm text-center">
        <p className="eyebrow mb-3">Chào mừng trở lại</p>
        <h1 className="mb-4 text-display-md">Đăng nhập</h1>

        {expired && (
          <p className="mb-6 rounded-xl2 border border-line bg-bone px-4 py-3 text-sm text-graphite">
            Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.
          </p>
        )}

        <p className="mb-8 text-sm text-graphite">
          Bạn sẽ được chuyển tới trang đăng nhập an toàn của hệ thống.
        </p>

        <LoginActions callbackUrl={callbackUrl} />

        <p className="mt-6 text-sm text-graphite">
          Chưa có tài khoản?{' '}
          <a href="/register" className="link-underline text-ink">
            Đăng ký
          </a>
        </p>
      </div>
    </div>
  );
}
