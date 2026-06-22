'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { sendContact } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function ContactPage() {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', subject: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await sendContact({ ...form, phone: form.phone || undefined });
      setForm({ fullName: '', email: '', phone: '', subject: '', content: '' });
      toast.success('Đã gửi liên hệ. Cảm ơn bạn — chúng tôi sẽ phản hồi sớm!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gửi liên hệ thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-line bg-ivory px-4 py-3 text-sm outline-none focus:border-ink';

  return (
    <div className="container-page min-h-screen pt-[calc(var(--header-h)+3rem)]">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-3">Liên hệ</p>
          <h1 className="text-display-md">Gặp gỡ MAISON</h1>
          <p className="mt-6 max-w-md leading-relaxed text-graphite">
            Có câu hỏi về sản phẩm, đơn hàng hay hợp tác? Để lại lời nhắn, đội ngũ của chúng tôi
            sẽ phản hồi trong thời gian sớm nhất.
          </p>
          <dl className="mt-8 space-y-3 text-sm text-graphite">
            <div><dt className="text-mist">Email</dt><dd>hello@maison.local</dd></div>
            <div><dt className="text-mist">Hotline</dt><dd>1900 0000</dd></div>
            <div><dt className="text-mist">Địa chỉ</dt><dd>Hà Nội, Việt Nam</dd></div>
          </dl>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-xl2 border border-line bg-bone p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <input className={inputCls} placeholder="Họ tên" value={form.fullName} onChange={onChange('fullName')} required />
            <input className={inputCls} type="email" placeholder="Email" value={form.email} onChange={onChange('email')} required />
          </div>
          <input className={inputCls} placeholder="Số điện thoại (tùy chọn)" value={form.phone} onChange={onChange('phone')} />
          <input className={inputCls} placeholder="Tiêu đề" value={form.subject} onChange={onChange('subject')} required />
          <textarea className={inputCls} rows={5} placeholder="Nội dung..." value={form.content} onChange={onChange('content')} required />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi liên hệ'}
          </Button>
        </form>
      </div>
    </div>
  );
}
