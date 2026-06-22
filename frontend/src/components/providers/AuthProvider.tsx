'use client';

import { SessionProvider } from 'next-auth/react';

// Bọc client để useSession() hoạt động ở Client Component.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
