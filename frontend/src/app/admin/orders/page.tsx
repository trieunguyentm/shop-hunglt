import { OrdersManager } from '@/components/admin/OrdersManager';

export const metadata = { title: 'Quản lý đơn hàng — MAISON' };

export default function AdminOrdersPage() {
  return (
    <div>
      <h1 className="mb-8 text-display-md">Quản lý đơn hàng</h1>
      <OrdersManager />
    </div>
  );
}
