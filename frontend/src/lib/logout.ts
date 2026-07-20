'use client';

import { signOut } from 'next-auth/react';

/**
 * Đăng xuất khỏi CẢ ứng dụng và phiên SSO của Keycloak.
 *
 * Thứ tự quan trọng: lấy URL end-session TRƯỚC (lúc còn session để đọc id_token),
 * rồi mới xoá cookie, cuối cùng chuyển hướng sang Keycloak.
 * Mọi bước đều có phương án dự phòng để nút đăng xuất không bao giờ "chết".
 */
export async function federatedSignOut() {
  let keycloakUrl: string | null = null;

  try {
    const res = await fetch('/api/auth/federated-logout', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { url?: string };
      keycloakUrl = data.url ?? null;
    }
  } catch {
    // Bỏ qua — vẫn đăng xuất cục bộ ở bước dưới.
  }

  // Xoá session của Auth.js, chưa điều hướng vội.
  await signOut({ redirect: false });

  window.location.href = keycloakUrl ?? '/';
}
