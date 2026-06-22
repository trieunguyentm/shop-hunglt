'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

// Đăng nhập được xử lý bởi Keycloak (OIDC). Trang này chỉ là cửa ngõ chuyển hướng.
export default function LoginPage() {
  return (
    <div className="container-page flex min-h-screen items-center justify-center pt-[var(--header-h)]">
      <div className="w-full max-w-sm text-center">
        <p className="eyebrow mb-3">Chào mừng trở lại</p>
        <h1 className="mb-4 text-display-md">Đăng nhập</h1>
        <p className="mb-8 text-sm text-graphite">
          Bạn sẽ được chuyển tới trang đăng nhập an toàn của hệ thống.
        </p>
        <Button className="w-full" onClick={() => signIn('keycloak', { callbackUrl: '/account' })}>
          Tiếp tục đăng nhập
        </Button>
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
