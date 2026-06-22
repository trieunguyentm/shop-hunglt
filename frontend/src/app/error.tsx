'use client';

import { useEffect } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-screen flex-col items-center justify-center pt-[var(--header-h)] text-center">
      <p className="eyebrow mb-4">Đã có lỗi</p>
      <h1 className="text-display-md">Rất tiếc, có sự cố xảy ra</h1>
      <p className="mt-4 max-w-md text-graphite">
        Vui lòng thử lại. Nếu lỗi tiếp diễn, hãy quay về trang chủ.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Thử lại</Button>
        <ButtonLink href="/" variant="outline">Về trang chủ</ButtonLink>
      </div>
    </div>
  );
}
