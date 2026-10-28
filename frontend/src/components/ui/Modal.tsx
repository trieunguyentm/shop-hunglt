'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Portal } from './Portal';

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

/** Khóa cuộn nền khi có lớp phủ — đếm số lớp để nhiều modal lồng nhau không mở khóa sớm. */
let lockCount = 0;
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lockCount++;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      lockCount--;
      if (lockCount === 0) document.body.style.overflow = prev;
    };
  }, [active]);
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  size?: keyof typeof SIZES;
  /** 'center' = hộp thoại giữa màn hình; 'right' = ngăn kéo trượt từ phải (form dài, chi tiết). */
  variant?: 'center' | 'right';
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Chặn đóng khi click nền (vd đang lưu). */
  dismissible?: boolean;
}

/**
 * Hộp thoại/ngăn kéo dùng chung: portal, Esc để đóng, khóa cuộn nền, giữ focus bên trong.
 */
export function Modal({ open, onClose, title, description, size = 'md', variant = 'center', footer, children, dismissible = true }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement;
    const t = setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('[data-autofocus], input, textarea, button:not([data-close])');
      (first ?? panelRef.current)?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
      if (e.key === 'Tab' && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      lastFocus.current?.focus?.();
    };
  }, [open, onClose, dismissible]);

  if (!open) return null;

  const isDrawer = variant === 'right';

  return (
    <Portal>
      <div className={cn('fixed inset-0 z-[70] flex', isDrawer ? 'justify-end' : 'items-end justify-center p-0 sm:items-center sm:p-4')}>
        <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={() => dismissible && onClose()} />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          className={cn(
            'relative flex w-full flex-col bg-surface shadow-pop outline-none',
            isDrawer
              ? cn('h-full animate-slide-in-right', SIZES[size === 'md' ? 'lg' : size])
              : cn('max-h-[92vh] animate-scale-in rounded-t-3xl sm:max-h-[88vh] sm:rounded-3xl', SIZES[size]),
          )}
        >
          {(title || description) && (
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <div className="min-w-0">
                {title && <h2 className="truncate text-lg font-bold">{title}</h2>}
                {description && <p className="mt-0.5 text-sm text-ink-3">{description}</p>}
              </div>
              <button
                type="button"
                data-close
                onClick={onClose}
                aria-label="Đóng"
                className="-mr-2 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-muted hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-canvas/60 px-5 py-4 sm:px-6">{footer}</div>
          )}
        </div>
      </div>
    </Portal>
  );
}
