'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { createAccount, getAccounts, updateAccount } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import type { AdminAccount } from '@/lib/types';

const ROLE_OPTIONS = ['ADMIN', 'STAFF', 'CUSTOMER'];

export function AccountsManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'STAFF',
  });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await getAccounts(token);
      setAccounts(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      await createAccount(token, {
        username: form.username,
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        roles: [form.role],
      });
      setForm({ fullName: '', username: '', email: '', password: '', role: 'STAFF' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tạo tài khoản thất bại');
    }
  }

  async function toggleEnabled(acc: AdminAccount) {
    if (!token) return;
    try {
      await updateAccount(token, acc.id, { enabled: !acc.enabled });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cập nhật thất bại');
    }
  }

  const inputCls =
    'rounded-lg border border-line bg-ivory px-3 py-2 text-sm outline-none focus:border-ink';

  return (
    <div className="space-y-10">
      {/* Form tạo tài khoản nhân viên/quản trị */}
      <form onSubmit={onCreate} className="rounded-xl2 border border-line bg-bone p-6">
        <h2 className="mb-4 font-display text-xl">Thêm tài khoản</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className={inputCls} placeholder="Họ tên" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <input className={inputCls} placeholder="Tên đăng nhập" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <input className={inputCls} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className={inputCls} type="password" placeholder="Mật khẩu" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <Button type="submit">Tạo tài khoản</Button>
        </div>
      </form>

      {error && <p className="text-sm text-clay-dark">{error}</p>}

      {/* Danh sách tài khoản */}
      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-bone text-mist">
            <tr>
              <th className="px-4 py-3 font-medium">Tên đăng nhập</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Vai trò</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-mist">Đang tải...</td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-mist">Chưa có tài khoản.</td></tr>
            ) : (
              accounts.map((acc) => (
                <tr key={acc.id} className="border-t border-line">
                  <td className="px-4 py-3">{acc.username}</td>
                  <td className="px-4 py-3">{acc.email}</td>
                  <td className="px-4 py-3">{acc.roles.join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={acc.enabled ? 'text-sage' : 'text-clay-dark'}>
                      {acc.enabled ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleEnabled(acc)}
                      className="link-underline text-graphite hover:text-ink"
                    >
                      {acc.enabled ? 'Khóa' : 'Mở khóa'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
