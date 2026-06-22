'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { registerCustomer } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const onChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      await registerCustomer(form);
      setStatus('success');
      setMessage('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Đăng ký thất bại');
    }
  }

  const inputCls =
    'w-full rounded-full border border-line bg-ivory px-5 py-3 text-sm outline-none focus:border-ink';

  return (
    <div className="container-page flex min-h-screen items-center justify-center py-[calc(var(--header-h)+2rem)]">
      <div className="w-full max-w-sm">
        <p className="eyebrow mb-3 text-center">Tạo tài khoản</p>
        <h1 className="mb-8 text-center text-display-md">Đăng ký</h1>

        {status === 'success' ? (
          <div className="text-center">
            <p className="mb-6 rounded-xl2 border border-line bg-bone p-5 text-sm text-graphite">
              {message}
            </p>
            <Button className="w-full" onClick={() => signIn('keycloak', { callbackUrl: '/account' })}>
              Đăng nhập ngay
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <input className={inputCls} placeholder="Họ và tên" value={form.fullName} onChange={onChange('fullName')} required />
            <input className={inputCls} placeholder="Tên đăng nhập" value={form.username} onChange={onChange('username')} required />
            <input className={inputCls} type="email" placeholder="Email" value={form.email} onChange={onChange('email')} required />
            <input className={inputCls} type="password" placeholder="Mật khẩu (tối thiểu 6 ký tự)" value={form.password} onChange={onChange('password')} required />
            <input className={inputCls} placeholder="Số điện thoại (tùy chọn)" value={form.phone} onChange={onChange('phone')} />

            {status === 'error' && <p className="text-sm text-clay-dark">{message}</p>}

            <Button className="w-full" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Đang xử lý...' : 'Đăng ký'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-graphite">
          Đã có tài khoản?{' '}
          <a href="/login" className="link-underline text-ink">
            Đăng nhập
          </a>
        </p>
      </div>
    </div>
  );
}
