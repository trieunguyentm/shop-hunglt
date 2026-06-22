import { AccountsManager } from '@/components/admin/AccountsManager';

export const metadata = { title: 'Quản lý tài khoản — MAISON' };

// UC7 — Quản lý tài khoản (ADMIN). Dữ liệu thao tác qua Keycloak Admin API ở backend.
export default function AdminAccountsPage() {
  return (
    <div>
      <h1 className="mb-8 text-display-md">Quản lý tài khoản</h1>
      <AccountsManager />
    </div>
  );
}
