import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata = { title: { default: 'Quản trị', template: '%s · Quản trị MAISON' } };

// Guard: chỉ ADMIN/STAFF mới vào được khu quản trị (middleware đã chặn người chưa đăng nhập).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const roles = session?.roles ?? [];
  if (!roles.includes('ADMIN') && !roles.includes('STAFF')) {
    redirect('/');
  }
  return <AdminShell role={roles.includes('ADMIN') ? 'ADMIN' : 'STAFF'}>{children}</AdminShell>;
}
