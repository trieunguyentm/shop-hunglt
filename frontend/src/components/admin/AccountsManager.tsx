'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, MoreHorizontal, Search, Trash2, Unlock, UserCog, UserPlus } from 'lucide-react';
import { createAccount, deleteAccount, getAccounts, updateAccount } from '@/lib/api';
import { useAdminList } from '@/hooks/useAdminList';
import { useDebounce } from '@/hooks/useDebounce';
import { errorMessage } from '@/lib/utils';
import { ROLE_LABEL, ROLE_TONE } from '@/lib/orderStatus';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Menu } from '@/components/ui/Menu';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Avatar, PageHeader } from '@/components/ui/misc';
import { Select } from '@/components/ui/Select';
import type { AdminAccount } from '@/lib/types';

const ROLE_OPTIONS = ['ADMIN', 'STAFF', 'CUSTOMER'].map((r) => ({ value: r, label: ROLE_LABEL[r] }));
const EMPTY = { fullName: '', username: '', email: '', password: '', role: 'STAFF' };

/** Vai trò nghiệp vụ chính của tài khoản (Keycloak có thể gán nhiều role). */
const primaryRole = (roles: string[]) => (roles.includes('ADMIN') ? 'ADMIN' : roles.includes('STAFF') ? 'STAFF' : 'CUSTOMER');

export function AccountsManager({ currentUserEmail }: { currentUserEmail?: string | null }) {
  const confirm = useConfirm();
  const [term, setTerm] = useState('');
  const search = useDebounce(term.trim());
  const list = useAdminList(getAccounts, { search: search || undefined });
  const token = list.token;

  const [form, setForm] = useState(EMPTY);
  const [showPw, setShowPw] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roleEdit, setRoleEdit] = useState<{ acc: AdminAccount; role: string } | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await createAccount(token, { username: form.username.trim().toLowerCase(), email: form.email.trim(), password: form.password, fullName: form.fullName.trim(), roles: [form.role] });
      toast.success(`Đã tạo tài khoản ${form.username}`);
      setForm(EMPTY);
      setOpen(false);
      await list.reload();
    } catch (err) {
      toast.error(errorMessage(err, 'Tạo tài khoản thất bại'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleEnabled(acc: AdminAccount) {
    if (!token) return;
    if (acc.enabled) {
      const ok = await confirm({ title: `Khóa tài khoản ${acc.username}?`, description: 'Người dùng sẽ bị đăng xuất và không thể đăng nhập lại cho đến khi được mở khóa.', confirmText: 'Khóa', danger: true });
      if (!ok) return;
    }
    try {
      await updateAccount(token, acc.id, { enabled: !acc.enabled });
      toast.success(acc.enabled ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      await list.reload();
    } catch (e) {
      toast.error(errorMessage(e, 'Cập nhật thất bại'));
    }
  }

  async function saveRole() {
    if (!token || !roleEdit) return;
    setSaving(true);
    try {
      await updateAccount(token, roleEdit.acc.id, { roles: [roleEdit.role] });
      toast.success(`Đã đổi vai trò ${roleEdit.acc.username} → ${ROLE_LABEL[roleEdit.role]}`);
      setRoleEdit(null);
      await list.reload();
    } catch (e) {
      toast.error(errorMessage(e, 'Đổi vai trò thất bại'));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(acc: AdminAccount) {
    if (!token) return;
    const ok = await confirm({ title: `Xóa tài khoản ${acc.username}?`, description: 'Tài khoản sẽ bị xóa khỏi hệ thống xác thực. Thao tác không thể hoàn tác.', confirmText: 'Xóa vĩnh viễn', danger: true });
    if (!ok) return;
    try {
      await deleteAccount(token, acc.id);
      toast.success('Đã xóa tài khoản');
      await list.reload();
    } catch (e) {
      toast.error(errorMessage(e, 'Xóa thất bại'));
    }
  }

  const columns: Column<AdminAccount>[] = [
    {
      key: 'user',
      header: 'Tài khoản',
      className: 'min-w-[200px]',
      cell: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.fullName || a.username} size={36} />
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {a.fullName || a.username}
              {a.email === currentUserEmail && <span className="ml-1.5 text-xs font-normal text-ink-3">(bạn)</span>}
            </p>
            <p className="truncate text-xs text-ink-3">@{a.username}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', hideOnMobile: true, cell: (a) => <span className="text-ink-2">{a.email}</span> },
    { key: 'role', header: 'Vai trò', cell: (a) => { const r = primaryRole(a.roles); return <Badge tone={ROLE_TONE[r]}>{ROLE_LABEL[r]}</Badge>; } },
    { key: 'status', header: 'Trạng thái', hideOnMobile: true, cell: (a) => <Badge tone={a.enabled ? 'success' : 'danger'} dot>{a.enabled ? 'Hoạt động' : 'Đã khóa'}</Badge> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (a) => {
        const self = a.email === currentUserEmail;
        return (
          <Menu
            width={210}
            items={[
              { label: 'Đổi vai trò', icon: <UserCog size={15} />, disabled: self, onSelect: () => setRoleEdit({ acc: a, role: primaryRole(a.roles) }) },
              { label: a.enabled ? 'Khóa tài khoản' : 'Mở khóa', icon: a.enabled ? <Lock size={15} /> : <Unlock size={15} />, disabled: self, onSelect: () => toggleEnabled(a) },
              { type: 'separator' },
              { label: 'Xóa tài khoản', icon: <Trash2 size={15} />, danger: true, disabled: self, onSelect: () => onDelete(a) },
            ]}
            trigger={(t) => (
              <button {...t} aria-label={`Thao tác cho ${a.username}`} className="grid h-9 w-9 place-items-center rounded-full text-ink-3 hover:bg-muted hover:text-ink">
                <MoreHorizontal size={18} />
              </button>
            )}
          />
        );
      },
    },
  ];

  return (
    <>
      <PageHeader title="Tài khoản" description="Quản lý người dùng & phân quyền (đồng bộ Keycloak)" actions={<Button leftIcon={<UserPlus size={17} />} onClick={() => setOpen(true)}>Thêm tài khoản</Button>} />
      <Input wrapperClassName="mb-4 max-w-md" placeholder="Tìm theo tên đăng nhập, email..." leftIcon={<Search size={16} />} value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Tìm tài khoản" />
      {list.error && <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{list.error}</p>}
      <DataTable
        columns={columns}
        rows={list.rows}
        rowKey={(a) => a.id}
        loading={list.loading}
        emptyTitle={search ? 'Không tìm thấy tài khoản' : 'Chưa có tài khoản'}
        footer={list.totalPages > 1 ? <Pagination page={list.page} totalPages={list.totalPages} onChange={list.setPage} /> : undefined}
      />

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title="Thêm tài khoản"
        description="Tài khoản được tạo trên Keycloak và dùng đăng nhập ngay"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Hủy</Button>
            <Button type="submit" form="account-form" loading={saving}>Tạo tài khoản</Button>
          </>
        }
      >
        <form id="account-form" onSubmit={onCreate} className="space-y-4">
          <Input label="Họ tên" required minLength={2} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Tên đăng nhập" required minLength={3} pattern="[a-zA-Z0-9._\-]+" title="Chữ không dấu, số, . _ -" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="off" />
            <Select label="Vai trò" value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={ROLE_OPTIONS} />
          </div>
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="off" />
          <Input
            label="Mật khẩu"
            required
            minLength={6}
            hint="Tối thiểu 6 ký tự"
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
            rightSlot={
              <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:bg-muted hover:text-ink">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </form>
      </Modal>

      <Modal
        open={!!roleEdit}
        onClose={() => !saving && setRoleEdit(null)}
        size="sm"
        title="Đổi vai trò"
        description={roleEdit ? `@${roleEdit.acc.username}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setRoleEdit(null)} disabled={saving}>Hủy</Button>
            <Button onClick={saveRole} loading={saving}>Lưu</Button>
          </>
        }
      >
        {roleEdit && (
          <div className="space-y-3">
            <Select label="Vai trò mới" value={roleEdit.role} onChange={(v) => setRoleEdit({ ...roleEdit, role: v })} options={ROLE_OPTIONS} />
            <p className="text-xs text-ink-3">Người dùng cần đăng nhập lại để quyền mới có hiệu lực.</p>
          </div>
        )}
      </Modal>
    </>
  );
}
