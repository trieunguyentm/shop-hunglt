import { ShieldAlert } from 'lucide-react';
import { auth } from '@/auth';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

/** Server guard cho trang chỉ ADMIN được dùng (STAFF thấy thông báo thay vì lỗi 403 từ API). */
export async function AdminOnly({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.roles?.includes('ADMIN')) {
    return (
      <EmptyState
        tone="danger"
        icon={<ShieldAlert size={24} />}
        title="Bạn không có quyền truy cập"
        description="Chức năng này chỉ dành cho Quản trị viên."
        action={<ButtonLink href="/admin">Về bảng điều khiển</ButtonLink>}
        className="mt-10"
      />
    );
  }
  return <>{children}</>;
}
