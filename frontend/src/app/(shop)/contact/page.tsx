'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { sendContact } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/misc';
import { Email } from '@/components/ui/Email';
import { errorMessage } from '@/lib/utils';

const EMPTY = { fullName: '', email: '', phone: '', subject: '', content: '' };

const INFO = [
  { icon: Mail, label: 'Email', value: <Email value="hello@maison.local" /> },
  { icon: Phone, label: 'Hotline', value: '1900 0000' },
  { icon: MapPin, label: 'Địa chỉ', value: 'Hà Nội, Việt Nam' },
  { icon: Clock, label: 'Giờ làm việc', value: '8:00 – 21:00, T2 – CN' },
];

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await sendContact({ ...form, phone: form.phone || undefined });
      setForm(EMPTY);
      setSent(true);
      toast.success('Đã gửi liên hệ. Chúng tôi sẽ phản hồi sớm!');
    } catch (err) {
      toast.error(errorMessage(err, 'Gửi liên hệ thất bại'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page page-top">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div>
          <p className="eyebrow mb-2">Liên hệ</p>
          <h1 className="heading-1">Nói chuyện với MAISON</h1>
          <p className="mt-4 max-w-md text-ink-2">
            Hỏi về size, đơn hàng hay hợp tác? Để lại lời nhắn — đội ngũ của chúng tôi phản hồi trong vòng 24 giờ.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {INFO.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-soft">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime-400 text-ink">
                  <Icon size={19} />
                </span>
                <div>
                  <p className="text-xs text-ink-3">{label}</p>
                  <p className="font-semibold">{value}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <Card className="sm:p-8">
          {sent ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 size={48} className="text-success" />
              <h2 className="mt-4 text-xl font-bold">Đã nhận được lời nhắn!</h2>
              <p className="mt-2 max-w-sm text-sm text-ink-3">Cảm ơn bạn. Chúng tôi sẽ phản hồi qua email trong thời gian sớm nhất.</p>
              <Button className="mt-6" variant="outline" onClick={() => setSent(false)}>
                Gửi lời nhắn khác
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <h2 className="mb-2 text-xl font-bold">Gửi lời nhắn</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Họ tên" required minLength={2} maxLength={100} value={form.fullName} onChange={set('fullName')} placeholder="Nguyễn Văn A" />
                <Input label="Email" type="email" required value={form.email} onChange={set('email')} placeholder="ban@email.com" />
              </div>
              <Input label="Số điện thoại" hint="Không bắt buộc" type="tel" maxLength={15} value={form.phone} onChange={set('phone')} placeholder="09xx xxx xxx" />
              <Input label="Tiêu đề" required minLength={2} maxLength={200} value={form.subject} onChange={set('subject')} placeholder="Tư vấn size áo sơ mi" />
              <Textarea label="Nội dung" required minLength={5} maxLength={2000} rows={5} value={form.content} onChange={set('content')} placeholder="Bạn cần MAISON hỗ trợ điều gì?" />
              <Button type="submit" size="lg" block loading={submitting} leftIcon={<Send size={17} />}>
                Gửi liên hệ
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
