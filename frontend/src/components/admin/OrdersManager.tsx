'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getAdminOrders, updateOrderStatus } from '@/lib/api';
import { formatVND } from '@/lib/utils';
import { ORDER_STATUS_LABEL } from '@/lib/orderStatus';
import type { Order, OrderStatus } from '@/lib/types';

const STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PACKING',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
];

export function OrdersManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setOrders((await getAdminOrders(token, filter || undefined)).data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải đơn');
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(id: string, status: string) {
    if (!token) return;
    try {
      await updateOrderStatus(token, id, status);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cập nhật thất bại');
    }
  }

  const selectCls = 'select-field';

  return (
    <div className="space-y-6">
      <select className={selectCls} value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">Tất cả trạng thái</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
        ))}
      </select>

      {error && <p className="text-sm text-clay-dark">{error}</p>}

      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-bone text-mist">
            <tr>
              <th className="px-4 py-3 font-medium">Mã đơn</th>
              <th className="px-4 py-3 font-medium">Khách</th>
              <th className="px-4 py-3 font-medium">Tổng</th>
              <th className="px-4 py-3 font-medium">Thanh toán</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-mist">Đang tải...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-mist">Chưa có đơn hàng.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{o.code}</td>
                  <td className="px-4 py-3">{o.customer?.fullName ?? '—'}</td>
                  <td className="px-4 py-3">{formatVND(o.total)}</td>
                  <td className="px-4 py-3 text-mist">{o.payment?.method} · {o.payment?.status}</td>
                  <td className="px-4 py-3">
                    <select
                      className={selectCls}
                      value={o.status}
                      onChange={(e) => changeStatus(o.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
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
