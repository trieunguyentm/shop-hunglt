'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getCustomer, getCustomers, updateCustomer } from '@/lib/api';
import { formatVND } from '@/lib/utils';
import { ORDER_STATUS_LABEL } from '@/lib/orderStatus';
import { Button } from '@/components/ui/Button';
import type { AdminCustomer, AdminCustomerDetail } from '@/lib/types';

export function CustomersManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [items, setItems] = useState<AdminCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<AdminCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setItems((await getCustomers(token, search || undefined)).data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải khách hàng');
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDetail(id: string) {
    if (!token) return;
    setDetail((await getCustomer(token, id)).data);
  }

  async function patch(id: string, input: { tier?: string; status?: string }) {
    if (!token) return;
    const r = await updateCustomer(token, id, input);
    setDetail(r.data);
    await load();
  }

  const inputCls = 'rounded-lg border border-line bg-ivory px-3 py-2 text-sm outline-none focus:border-ink';

  return (
    <div className="space-y-6">
      <input
        className={`${inputCls} w-full max-w-sm`}
        placeholder="Tìm theo tên / SĐT / email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {error && <p className="text-sm text-clay-dark">{error}</p>}

      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-bone text-mist">
            <tr>
              <th className="px-4 py-3 font-medium">Khách hàng</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">SĐT</th>
              <th className="px-4 py-3 font-medium">Hạng</th>
              <th className="px-4 py-3 font-medium">Số đơn</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-mist">Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-mist">Chưa có khách hàng.</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="cursor-pointer border-t border-line hover:bg-bone" onClick={() => openDetail(c.id)}>
                  <td className="px-4 py-3 font-medium">{c.fullName}</td>
                  <td className="px-4 py-3 text-mist">{c.account.email}</td>
                  <td className="px-4 py-3">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3">{c.tier === 'VIP' ? <span className="text-gold">VIP</span> : 'Thường'}</td>
                  <td className="px-4 py-3">{c._count?.orders ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={c.account.status === 'ACTIVE' ? 'text-sage' : 'text-clay-dark'}>
                      {c.account.status === 'ACTIVE' ? 'Hoạt động' : 'Khóa'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[85vh] w-full max-w-xl overflow-auto rounded-xl2 bg-ivory p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl">{detail.fullName}</h3>
              <button onClick={() => setDetail(null)} className="text-mist">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-mist">Email</span><span>{detail.account.email}</span>
              <span className="text-mist">SĐT</span><span>{detail.phone ?? '—'}</span>
              <span className="text-mist">Hạng</span><span>{detail.tier}</span>
              <span className="text-mist">Tổng chi tiêu</span><span className="font-medium text-clay">{formatVND(detail.totalSpent)}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => patch(detail.id, { tier: detail.tier === 'VIP' ? 'REGULAR' : 'VIP' })}>
                {detail.tier === 'VIP' ? 'Bỏ VIP' : 'Đặt VIP'}
              </Button>
              <Button variant="outline" onClick={() => patch(detail.id, { status: detail.account.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE' })}>
                {detail.account.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
              </Button>
            </div>

            <h4 className="eyebrow mb-2 mt-6">Lịch sử đơn ({detail.orders.length})</h4>
            <ul className="divide-y divide-line border-y border-line">
              {detail.orders.map((o) => (
                <li key={o.id} className="flex justify-between py-2 text-sm">
                  <span>{o.code} · {ORDER_STATUS_LABEL[o.status]}</span>
                  <span>{formatVND(o.total)}</span>
                </li>
              ))}
              {detail.orders.length === 0 && <li className="py-2 text-sm text-mist">Chưa có đơn.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
