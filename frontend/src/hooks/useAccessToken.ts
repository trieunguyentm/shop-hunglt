'use client';

import { useSession } from 'next-auth/react';

/**
 * Lấy access token Keycloak của phiên hiện tại cho các lời gọi API phía client.
 * `ready` = đã xác định xong trạng thái phiên (tránh gọi API khi đang khôi phục phiên).
 */
export function useAccessToken() {
  const { data: session, status } = useSession();
  return {
    token: session?.accessToken,
    status,
    ready: status !== 'loading',
    session,
    roles: session?.roles ?? [],
  };
}
