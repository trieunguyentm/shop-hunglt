import { PromotionsManager } from '@/components/admin/PromotionsManager';
import { AdminOnly } from '@/components/admin/AdminOnly';

export const metadata = { title: 'Khuyến mãi' };

export default function Page() {
  return (
    <AdminOnly>
      <PromotionsManager />
    </AdminOnly>
  );
}
