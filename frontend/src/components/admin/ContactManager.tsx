'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getContactMessages, updateContactStatus } from '@/lib/api';
import type { ContactMessage } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Mới',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã xử lý',
};

export function ContactManager() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setItems((await getContactMessages(token, filter || undefined)).data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải tin nhắn');
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(id: string, status: string) {
    if (!token) return;
    await updateContactStatus(token, id, status);
    await load();
    setSelected((s) => (s && s.id === id ? { ...s, status: status as ContactMessage['status'] } : s));
  }

  const selectCls = 'select-field';

  return (
    <div className="space-y-6">
      <select className={selectCls} value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">Tất cả trạng thái</option>
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      {error && <p className="text-sm text-clay-dark">{error}</p>}

      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-bone text-mist">
            <tr>
              <th className="px-4 py-3 font-medium">Ngày</th>
              <th className="px-4 py-3 font-medium">Người gửi</th>
              <th className="px-4 py-3 font-medium">Tiêu đề</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-mist">Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-mist">Chưa có tin nhắn.</td></tr>
            ) : (
              items.map((m) => (
                <tr key={m.id} className="cursor-pointer border-t border-line hover:bg-bone" onClick={() => setSelected(m)}>
                  <td className="px-4 py-3 text-mist">{new Date(m.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">{m.fullName}<br /><span className="text-xs text-mist">{m.email}</span></td>
                  <td className="px-4 py-3">{m.subject}</td>
                  <td className="px-4 py-3">{STATUS_LABEL[m.status]}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-xl2 bg-ivory p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl">{selected.subject}</h3>
              <button onClick={() => setSelected(null)} className="text-mist">✕</button>
            </div>
            <p className="text-sm text-mist">{selected.fullName} · {selected.email}{selected.phone ? ` · ${selected.phone}` : ''}</p>
            <p className="mt-4 whitespace-pre-wrap text-sm text-graphite">{selected.content}</p>
            <div className="mt-6">
              <p className="eyebrow mb-2">Trạng thái xử lý</p>
              <select className={selectCls} value={selected.status} onChange={(e) => changeStatus(selected.id, e.target.value)}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
