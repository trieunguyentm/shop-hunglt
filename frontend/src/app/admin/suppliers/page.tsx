import { SuppliersManager } from '@/components/admin/SuppliersManager';

export const metadata = { title: 'Quản lý nhà cung cấp — MAISON' };

export default function AdminSuppliersPage() {
  return (
    <div>
      <h1 className="mb-8 text-display-md">Quản lý nhà cung cấp</h1>
      <SuppliersManager />
    </div>
  );
}
