import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, LayoutDashboard, MapPin, Package, ShoppingBag } from 'lucide-react';
import { auth } from '@/auth';
import { ApiError, getMe } from '@/lib/api';
import { SignOutButton } from '@/components/account/SignOutButton';
import { Avatar, Card, DescriptionList } from '@/components/ui/misc';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Email } from '@/components/ui/Email';
import { ROLE_LABEL, ROLE_TONE } from '@/lib/orderStatus';
import type { AuthUser } from '@/lib/types';

export const metadata = { title: 'Tài khoản' };

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

  const name = profile?.customer?.fullName ?? session.user?.name ?? profile?.username ?? '';
  const isStaff = profile?.role === 'ADMIN' || profile?.role === 'STAFF';

  const links = [
    { href: '/orders', icon: Package, title: 'Đơn hàng của tôi', text: 'Theo dõi & lịch sử mua hàng' },
    { href: '/cart', icon: ShoppingBag, title: 'Giỏ hàng', text: 'Các món bạn đã chọn' },
    ...(isStaff ? [{ href: '/admin', icon: LayoutDashboard, title: 'Khu quản trị', text: 'Quản lý cửa hàng' }] : []),
  ];

  return (
    <div className="container-page page-top max-w-4xl">
      {error ? (
        <EmptyState tone="danger" title="Không tải được hồ sơ" description={error} action={<SignOutButton />} />
      ) : (
        profile && (
          <div className="space-y-6">
            <Card className="relative overflow-hidden bg-ink text-white sm:p-8">
              <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-lime-400/30 blur-3xl" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                <Avatar name={name} size={72} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/60">Xin chào,</p>
                  <h1 className="truncate text-2xl font-extrabold text-white sm:text-3xl">{name}</h1>
                  <div className="mt-2">
                    <Badge tone={profile.role === 'CUSTOMER' ? 'lime' : ROLE_TONE[profile.role]}>{ROLE_LABEL[profile.role]}</Badge>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              {links.map(({ href, icon: Icon, title, text }) => (
                <Link key={href} href={href} className="group flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 transition-all hover:border-ink hover:shadow-soft">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted transition-colors group-hover:bg-lime-400">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{title}</p>
                    <p className="truncate text-xs text-ink-3">{text}</p>
                  </div>
                  <ChevronRight size={18} className="text-ink-4" />
                </Link>
              ))}
            </div>

            <Card>
              <h2 className="mb-2 font-bold">Thông tin tài khoản</h2>
              <DescriptionList
                items={[
                  { label: 'Họ tên', value: profile.customer?.fullName ?? '—' },
                  { label: 'Tên đăng nhập', value: profile.username },
                  { label: 'Email', value: <Email value={profile.email} /> },
                  { label: 'Số điện thoại', value: profile.customer?.phone ?? '—' },
                ]}
              />
              <p className="mt-4 flex items-start gap-2 rounded-2xl bg-muted p-4 text-xs text-ink-3">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                Thông tin đăng nhập được quản lý bởi hệ thống xác thực Keycloak. Địa chỉ giao hàng nhập ở bước thanh toán.
              </p>
            </Card>

            <SignOutButton />
          </div>
        )
      )}
    </div>
  );
}
