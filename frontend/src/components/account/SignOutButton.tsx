'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { federatedSignOut } from '@/lib/logout';

export function SignOutButton() {
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void federatedSignOut();
      }}
    >
      {busy ? 'Đang đăng xuất…' : 'Đăng xuất'}
    </Button>
  );
}
