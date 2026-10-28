'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/** Nút chuyển sang trang đăng nhập Keycloak, quay lại đúng trang người dùng đang xem. */
export function LoginActions({ callbackUrl }: { callbackUrl: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="lg"
      block
      loading={busy}
      leftIcon={<LogIn size={18} />}
      onClick={() => {
        setBusy(true);
        void signIn('keycloak', { callbackUrl });
      }}
    >
      Tiếp tục đăng nhập
    </Button>
  );
}
