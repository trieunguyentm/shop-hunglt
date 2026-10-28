'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { federatedSignOut } from '@/lib/logout';

export function SignOutButton({ block }: { block?: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      block={block}
      loading={busy}
      leftIcon={<LogOut size={16} />}
      onClick={() => {
        setBusy(true);
        void federatedSignOut();
      }}
    >
      Đăng xuất
    </Button>
  );
}
