import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Clock, ShieldCheck } from 'lucide-react';
import { auth } from '@/auth';
import { LoginActions } from '@/components/account/LoginActions';
import { AuthShell } from '@/components/account/AuthShell';

export const metadata = { title: 'Đăng nhập' };

// Chỉ chấp nhận đường dẫn nội bộ để tránh open redirect (//evil.com, https://evil.com).
function safeCallback(raw?: string): string {
  if (!raw) return '/account';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/account';
  return raw;
}

// Đăng nhập được xử lý bởi Keycloak (OIDC). Trang này là cửa ngõ chuyển hướng.
export default async function LoginPage({ searchParams }: { searchParams?: { callbackUrl?: string; reason?: string } }) {
  const callbackUrl = safeCallback(searchParams?.callbackUrl);
  const expired = searchParams?.reason === 'session_expired';

  // Đã đăng nhập và phiên còn hiệu lực → không cần ở lại trang này.
  const session = await auth();
  if (session?.accessToken && !session.error) {
    redirect(callbackUrl);
  }

  return (
    <AuthShell>
      <p className="eyebrow mb-2">Chào mừng trở lại</p>
      <h1 className="heading-1">Đăng nhập</h1>
      <p className="mt-3 text-ink-2">Bạn sẽ được chuyển tới trang đăng nhập bảo mật của MAISON.</p>

      {expired && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-warning-soft p-4 text-sm font-medium text-warning">
          <Clock size={18} className="mt-0.5 shrink-0" />
          Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.
        </div>
      )}

      <div className="mt-8">
        <LoginActions callbackUrl={callbackUrl} />
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-3">
        <ShieldCheck size={14} /> Xác thực qua Keycloak (OpenID Connect)
      </p>

      <div className="my-8 h-px bg-line" />
      <p className="text-center text-sm text-ink-2">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-bold text-ink underline-offset-4 hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </AuthShell>
  );
}
