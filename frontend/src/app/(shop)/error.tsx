'use client';

import { useEffect } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="container-page page-top">
      <EmptyState
        tone="danger"
        icon={<TriangleAlert size={24} />}
        title="Rất tiếc, đã có sự cố"
        description="Vui lòng thử lại. Nếu lỗi tiếp diễn, hãy quay về trang chủ."
        action={
          <>
            <Button onClick={reset} leftIcon={<RefreshCw size={16} />}>Thử lại</Button>
            <ButtonLink href="/" variant="outline">Về trang chủ</ButtonLink>
          </>
        }
        className="min-h-[50vh]"
      />
    </div>
  );
}
