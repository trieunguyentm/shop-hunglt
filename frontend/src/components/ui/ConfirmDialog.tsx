'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** Thao tác nguy hiểm (xóa, khóa) → nút đỏ + biểu tượng cảnh báo. */
  danger?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Cung cấp hộp thoại xác nhận dạng Promise cho toàn app:
 *   const confirm = useConfirm();
 *   if (await confirm({ title: 'Xóa sản phẩm?', danger: true })) { ... }
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(v: boolean) => void>();

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (v: boolean) => {
    resolver.current?.(v);
    resolver.current = undefined;
    setOpts(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!opts} onClose={() => close(false)} size="sm">
        {opts && (
          <div className="flex flex-col items-center pt-2 text-center">
            <span
              className={
                opts.danger
                  ? 'grid h-12 w-12 place-items-center rounded-full bg-danger-soft text-danger'
                  : 'grid h-12 w-12 place-items-center rounded-full bg-muted text-ink'
              }
            >
              {opts.danger ? <AlertTriangle size={22} /> : <HelpCircle size={22} />}
            </span>
            <h2 className="mt-4 text-lg font-bold">{opts.title}</h2>
            {opts.description && <div className="mt-2 text-sm text-ink-2">{opts.description}</div>}
            <div className="mt-6 grid w-full grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => close(false)}>
                {opts.cancelText ?? 'Hủy'}
              </Button>
              <Button variant={opts.danger ? 'danger' : 'primary'} onClick={() => close(true)} data-autofocus>
                {opts.confirmText ?? 'Xác nhận'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm phải dùng bên trong <ConfirmProvider>');
  return ctx;
}
