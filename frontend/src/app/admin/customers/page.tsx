import { CustomersManager } from '@/components/admin/CustomersManager';

export const metadata = { title: 'Quản lý khách hàng — MAISON' };

export default function AdminCustomersPage() {
  return (
    <div>
      <h1 className="mb-8 text-display-md">Quản lý khách hàng</h1>
      <CustomersManager />
    </div>
  );
}
