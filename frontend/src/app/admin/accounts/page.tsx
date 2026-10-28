import { AccountsManager } from '@/components/admin/AccountsManager';
import { AdminOnly } from '@/components/admin/AdminOnly';
import { auth } from '@/auth';

export const metadata = { title: 'Tài khoản' };

export default async function Page() {
  const session = await auth();
  return (
    // UC7 — ADMIN. Thao tác qua Keycloak Admin API ở backend.
    <AdminOnly>
      <AccountsManager currentUserEmail={session?.user?.email} />
    </AdminOnly>
  );
}
