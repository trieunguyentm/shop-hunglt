'use client';

import { Toaster } from 'sonner';

/** Thông báo nổi (toast) theo thiết kế hệ thống. Gọi qua `toast.success/error` từ 'sonner'. */
export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      offset={16}
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-[calc(100vw-32px)] max-w-[380px] items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 text-sm font-medium text-white shadow-pop',
          title: 'font-semibold',
          description: 'text-white/70 text-xs mt-0.5',
          success: '[&_[data-icon]]:text-lime-400',
          error: '[&_[data-icon]]:text-brand-500',
          info: '[&_[data-icon]]:text-white',
          actionButton: 'ml-auto rounded-full bg-lime-400 px-3 py-1.5 text-xs font-bold text-ink',
          cancelButton: 'rounded-full bg-white/10 px-3 py-1.5 text-xs',
        },
      }}
    />
  );
}
