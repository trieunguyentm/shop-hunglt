import { Suspense } from 'react';
import { OrdersManager } from '@/components/admin/OrdersManager';

export const metadata = { title: 'Đơn hàng' };

export default function Page() {
  // OrdersManager đọc ?status= từ URL (useSearchParams) → cần Suspense boundary
  return (
    <Suspense>
      <OrdersManager />
    </Suspense>
  );
}
