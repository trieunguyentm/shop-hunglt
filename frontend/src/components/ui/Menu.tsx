'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Portal } from './Portal';
import { popoverStyle, usePopover } from './usePopover';

export type MenuItem =
  | {
      type?: 'item';
      label: React.ReactNode;
      icon?: React.ReactNode;
      href?: string;
      onSelect?: () => void;
      danger?: boolean;
      disabled?: boolean;
    }
  | { type: 'separator' }
  | { type: 'label'; label: React.ReactNode };

/**
 * Menu thả xuống cho hành động (menu tài khoản, thao tác dòng trong bảng...).
 * `trigger` nhận props để gắn vào nút bất kỳ.
 */
export function Menu({
  trigger,
  items,
  align = 'end',
  width = 224,
  header,
}: {
  trigger: (p: { ref: React.Ref<HTMLButtonElement>; onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu' }) => React.ReactNode;
  items: MenuItem[];
  align?: 'start' | 'end';
  width?: number;
  header?: React.ReactNode;
}) {
  const { triggerRef, popoverRef, open, setOpen, pos } = usePopover<HTMLButtonElement>({ align, matchWidth: false });

  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const nodes = Array.from(popoverRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      nodes[(i + 1) % nodes.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nodes[(i - 1 + nodes.length) % nodes.length]?.focus();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  const itemCls = (danger?: boolean, disabled?: boolean) =>
    cn(
      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium outline-none transition-colors',
      danger ? 'text-danger hover:bg-danger-soft focus:bg-danger-soft' : 'text-ink-2 hover:bg-muted hover:text-ink focus:bg-muted',
      disabled && 'pointer-events-none opacity-40',
    );

  return (
    <>
      {trigger({ ref: triggerRef, onClick: () => setOpen(!open), 'aria-expanded': open, 'aria-haspopup': 'menu' })}
      {open && (
        <Portal>
          <div
            ref={popoverRef}
            role="menu"
            onKeyDown={onKey}
            style={{ ...popoverStyle(pos), width }}
            className="z-[80] animate-scale-in overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-pop"
          >
            {header}
            {items.map((it, i) => {
              if (it.type === 'separator') return <div key={i} className="my-1.5 h-px bg-line" />;
              if (it.type === 'label') return <p key={i} className="eyebrow px-3 pb-1 pt-2">{it.label}</p>;
              const content = (
                <>
                  {it.icon && <span className="shrink-0 opacity-80">{it.icon}</span>}
                  {it.label}
                </>
              );
              return it.href ? (
                <Link key={i} href={it.href} role="menuitem" className={itemCls(it.danger, it.disabled)} onClick={() => setOpen(false)}>
                  {content}
                </Link>
              ) : (
                <button
                  key={i}
                  type="button"
                  role="menuitem"
                  aria-disabled={it.disabled}
                  className={itemCls(it.danger, it.disabled)}
                  onClick={() => {
                    setOpen(false);
                    it.onSelect?.();
                  }}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </Portal>
      )}
    </>
  );
}
