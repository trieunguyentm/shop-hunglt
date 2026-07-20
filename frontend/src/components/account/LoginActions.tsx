'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

/** Nút chuyển sang trang đăng nhập Keycloak, quay lại đúng trang người dùng đang xem. */
export function LoginActions({ callbackUrl }: { callbackUrl: string }) {
  return (
    <Button className="w-full" onClick={() => signIn('keycloak', { callbackUrl })}>
      Tiếp tục đăng nhập
    </Button>
  );
}
