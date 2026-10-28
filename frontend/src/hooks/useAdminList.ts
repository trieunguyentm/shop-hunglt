'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiResponse } from '@/lib/types';
import { errorMessage } from '@/lib/utils';
import { useAccessToken } from './useAccessToken';

type Meta = NonNullable<ApiResponse<unknown>['meta']>;

/**
 * Tải danh sách có phân trang cho khu quản trị.
 *  - Tự gắn token, chờ phiên sẵn sàng.
 *  - Bỏ kết quả của request cũ nếu tham số đã đổi (tránh nhảy dữ liệu khi gõ tìm kiếm).
 *  - Đổi bộ lọc (deps) → quay về trang 1.
 */
export function useAdminList<T, P extends object = object>(
  fetcher: (token: string, params: P & { page: number; pageSize: number }) => Promise<ApiResponse<T[]>>,
  params: P,
  { pageSize = 20 }: { pageSize?: number } = {},
) {
  const { token } = useAccessToken();
  const [rows, setRows] = useState<T[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reqId = useRef(0);
  const paramsKey = JSON.stringify(params);

  // Bộ lọc đổi → về trang 1
  useEffect(() => {
    setPage(1);
  }, [paramsKey]);

  const load = useCallback(async () => {
    if (!token) return;
    const id = ++reqId.current;
    setLoading(true);
    setError('');
    try {
      const res = await fetcher(token, { ...(JSON.parse(paramsKey) as P), page, pageSize });
      if (id !== reqId.current) return;
      setRows(res.data);
      setMeta(res.meta ?? null);
    } catch (e) {
      if (id !== reqId.current) return;
      setError(errorMessage(e, 'Không tải được dữ liệu'));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
    // fetcher là hàm module-level ổn định
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, paramsKey, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    rows,
    setRows,
    meta,
    total: meta?.total ?? rows.length,
    totalPages: meta?.totalPages ?? 1,
    page,
    setPage,
    loading,
    error,
    reload: load,
    token,
  };
}
