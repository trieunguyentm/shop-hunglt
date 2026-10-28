'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, User, AtSign } from 'lucide-react';
import { registerCustomer } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthShell } from '@/components/account/AuthShell';
import { errorMessage } from '@/lib/utils';

const EMPTY = { fullName: '', username: '', email: '', password: '', phone: '' };

export default function RegisterPage() {
  const [form, setForm] = useState(EMPTY);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError('');
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await registerCustomer({ ...form, username: form.username.trim().toLowerCase(), phone: form.phone || undefined });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err, 'Đăng ký thất bại'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      {done ? (
        <div className="text-center">
          <CheckCircle2 size={52} className="mx-auto text-success" />
          <h1 className="heading-2 mt-4">Tạo tài khoản thành công!</h1>
          <p className="mt-2 text-ink-2">
            Chào mừng <b>{form.fullName}</b> đến với MAISON. Đăng nhập để bắt đầu mua sắm.
          </p>
          <Button size="lg" block className="mt-8" onClick={() => signIn('keycloak', { callbackUrl: '/account' })}>
            Đăng nhập ngay
          </Button>
        </div>
      ) : (
        <>
          <p className="eyebrow mb-2">Thành viên mới</p>
          <h1 className="heading-1">Tạo tài khoản</h1>
          <p className="mt-3 text-ink-2">Chỉ mất 30 giây — lưu giỏ hàng, theo dõi đơn và nhận ưu đãi thành viên.</p>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <Input label="Họ và tên" required minLength={2} leftIcon={<User size={16} />} value={form.fullName} onChange={set('fullName')} autoComplete="name" placeholder="Nguyễn Văn A" />
            <Input
              label="Tên đăng nhập"
              required
              minLength={3}
              maxLength={50}
              pattern="[a-zA-Z0-9._\-]+"
              title="Chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới, gạch ngang"
              hint="Chữ không dấu, số, . _ -"
              leftIcon={<AtSign size={16} />}
              value={form.username}
              onChange={set('username')}
              autoComplete="username"
            />
            <Input label="Email" type="email" required leftIcon={<Mail size={16} />} value={form.email} onChange={set('email')} autoComplete="email" placeholder="ban@email.com" />
            <Input
              label="Mật khẩu"
              type={showPw ? 'text' : 'password'}
              required
              minLength={6}
              hint="Tối thiểu 6 ký tự"
              leftIcon={<Lock size={16} />}
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
              rightSlot={
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:bg-muted hover:text-ink">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            <Input label="Số điện thoại" hint="Không bắt buộc" type="tel" leftIcon={<Phone size={16} />} value={form.phone} onChange={set('phone')} autoComplete="tel" />

            {error && <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{error}</p>}

            <Button size="lg" block type="submit" loading={loading}>
              Tạo tài khoản
            </Button>
          </form>
        </>
      )}

      <div className="my-8 h-px bg-line" />
      <p className="text-center text-sm text-ink-2">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-bold text-ink underline-offset-4 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
