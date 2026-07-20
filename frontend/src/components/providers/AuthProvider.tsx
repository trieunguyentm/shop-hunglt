'use client';

import { SessionProvider } from 'next-auth/react';
import { SessionGuard } from './SessionGuard';

// Bọc client để useSession() hoạt động ở Client Component.
// SessionGuard theo dõi phiên hết hạn và điều hướng về /login khi cần.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionGuard />
      {children}
    </SessionProvider>
  );
}
