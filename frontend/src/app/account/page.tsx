import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ApiError, getMe } from '@/lib/api';
import { SignOutButton } from '@/components/account/SignOutButton';
import type { AuthUser } from '@/lib/types';

export const metadata = { title: 'Tài khoản — MAISON' };

const LOGIN_EXPIRED = '/login?callbackUrl=%2Faccount&reason=session_expired';

// Server Component — middleware đã đảm bảo người dùng đã đăng nhập.
export default async function AccountPage() {
  const session = await auth();

  // Lớp bảo vệ thứ hai: phiên hỏng/hết hạn → về trang đăng nhập, không hiển thị lỗi thô.
  if (!session?.accessToken || session.error) {
    redirect(LOGIN_EXPIRED);
  }

  let profile: AuthUser | null = null;
  let error: string | null = null;
  let expired = false;

  try {
    profile = (await getMe(session.accessToken)).data;
  } catch (e) {
    // Token bị Keycloak thu hồi giữa chừng → coi như hết phiên.
    if (e instanceof ApiError && (e.isUnauthorized || e.isForbidden)) {
      expired = true;
    } else {
      error = e instanceof Error ? e.message : 'Không tải được hồ sơ';
    }
  }

  // Gọi redirect() NGOÀI try/catch: nó hoạt động bằng cách ném NEXT_REDIRECT,
  // nếu đặt bên trong sẽ bị chính khối catch nuốt mất.
  if (expired) {
    redirect(LOGIN_EXPIRED);
  }

  return (
    <div className="container-page min-h-screen pt-[calc(var(--header-h)+3rem)]">
      <p className="eyebrow mb-3">Xin chào{profile ? `, ${profile.customer?.fullName ?? profile.username}` : ''}</p>
      <h1 className="mb-10 text-display-md">Tài khoản của tôi</h1>

      {error && (
        <div className="rounded-xl2 border border-dashed border-line bg-bone p-6">
          <p className="text-sm text-mist">{error}</p>
          <div className="mt-4">
            <SignOutButton />
          </div>
        </div>
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
