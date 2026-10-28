'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** Render children vào document.body (chỉ sau khi mount để an toàn với SSR). */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}
