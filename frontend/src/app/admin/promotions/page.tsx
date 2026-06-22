import { PromotionsManager } from '@/components/admin/PromotionsManager';

export const metadata = { title: 'Quản lý khuyến mãi — MAISON' };

export default function AdminPromotionsPage() {
  return (
    <div>
      <h1 className="mb-8 text-display-md">Quản lý khuyến mãi</h1>
      <PromotionsManager />
    </div>
  );
}
