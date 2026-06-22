import { auth } from '@/auth';
import { getMe } from '@/lib/api';
import { SignOutButton } from '@/components/account/SignOutButton';
import type { AuthUser } from '@/lib/types';

export const metadata = { title: 'Tài khoản — MAISON' };

// Server Component — middleware đã đảm bảo người dùng đã đăng nhập.
export default async function AccountPage() {
  const session = await auth();
  let profile: AuthUser | null = null;
  let error: string | null = null;

  if (session?.accessToken) {
    try {
      profile = (await getMe(session.accessToken)).data;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Không tải được hồ sơ';
    }
  }

  return (
    <div className="container-page min-h-screen pt-[calc(var(--header-h)+3rem)]">
      <p className="eyebrow mb-3">Xin chào{profile ? `, ${profile.customer?.fullName ?? profile.username}` : ''}</p>
      <h1 className="mb-10 text-display-md">Tài khoản của tôi</h1>

      {error && (
        <p className="rounded-xl2 border border-dashed border-line bg-bone p-6 text-sm text-mist">
          {error}. Đảm bảo backend đang chạy.
        </p>
      )}

      {profile && (
        <div className="grid max-w-2xl gap-6">
          <div className="rounded-xl2 border border-line bg-bone p-6">
            <h2 className="font-display text-xl mb-4">Thông tin</h2>
            <dl className="grid grid-cols-3 gap-y-3 text-sm">
              <dt className="text-mist">Tên đăng nhập</dt>
              <dd className="col-span-2">{profile.username}</dd>
              <dt className="text-mist">Email</dt>
              <dd className="col-span-2">{profile.email}</dd>
              <dt className="text-mist">Họ tên</dt>
              <dd className="col-span-2">{profile.customer?.fullName ?? '—'}</dd>
              <dt className="text-mist">Vai trò</dt>
              <dd className="col-span-2">{profile.role}</dd>
            </dl>
          </div>

          <div className="flex gap-3">
            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  );
}
