import { Dashboard } from '@/components/admin/Dashboard';

export const metadata = { title: 'Quản trị — MAISON' };

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="mb-8 text-display-md">Tổng quan</h1>
      <Dashboard />
    </div>
  );
}
