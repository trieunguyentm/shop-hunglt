'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Field, fieldBase, fieldSizes } from './Input';
import { Portal } from './Portal';
import { popoverStyle, usePopover } from './usePopover';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  size?: keyof typeof fieldSizes;
  /** Ô tìm kiếm trong danh sách — mặc định bật khi có > 8 lựa chọn. */
  searchable?: boolean;
  /** Dáng viên thuốc (thanh lọc) thay vì ô vuông bo góc (form). */
  pill?: boolean;
  className?: string;
  wrapperClassName?: string;
  'aria-label'?: string;
  /** Nhãn hiển thị trên trigger khác với nhãn option (vd "Sắp xếp: Mới nhất"). */
  renderValue?: (opt: SelectOption | undefined) => React.ReactNode;
}

/**
 * Dropdown chọn một giá trị — thay thế <select> native để đồng bộ thiết kế.
 * Hỗ trợ bàn phím (↑ ↓ Enter Esc Home End), tìm kiếm, ràng buộc `required` khi submit form.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = 'Chọn...',
  label,
  hint,
  error,
  required,
  disabled,
  size = 'md',
  searchable,
  pill,
  className,
  wrapperClassName,
  renderValue,
  ...aria
}: SelectProps) {
  const id = useId();
  const listId = `${id}-list`;
  const { triggerRef, popoverRef, open, setOpen, pos } = usePopover<HTMLButtonElement>();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const canSearch = searchable ?? options.length > 8;

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
    return options.filter((o) => strip(o.label).includes(strip(q)));
  }, [options, query]);

  // Mở → focus ô tìm kiếm / đặt con trỏ vào mục đang chọn
  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const idx = Math.max(0, filtered.findIndex((o) => o.value === value));
    setActive(idx);
    requestAnimationFrame(() => {
      if (canSearch) searchRef.current?.focus();
      else listRef.current?.focus();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function choose(opt: SelectOption | undefined) {
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function move(delta: number) {
    if (!filtered.length) return;
    let i = active;
    for (let n = 0; n < filtered.length; n++) {
      i = (i + delta + filtered.length) % filtered.length;
      if (!filtered[i].disabled) break;
    }
    setActive(i);
  }

  function onListKey(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        move(-1);
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(filtered.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        choose(filtered[active]);
        break;
      case 'Escape':
        // Không để Esc lan lên Modal chứa dropdown (chỉ đóng dropdown)
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  }

  const trigger = (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-describedby={error ? `${id}-err` : undefined}
        aria-label={aria['aria-label']}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          fieldBase,
          fieldSizes[size],
          'flex items-center justify-between gap-2 pr-3 text-left',
          pill && 'rounded-full pl-4 font-medium',
          error ? 'border-danger' : open ? 'border-ink shadow-ring' : 'border-line',
          className,
        )}
      >
        <span className={cn('flex min-w-0 items-center gap-2 truncate', !selected && 'text-ink-3')}>
          {renderValue ? renderValue(selected) : (
            <>
              {selected?.icon}
              <span className="truncate">{selected?.label ?? placeholder}</span>
            </>
          )}
        </span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-ink-3 transition-transform duration-200', open && 'rotate-180 text-ink')}
        />
      </button>
      {/* Ô ẩn giúp trình duyệt chặn submit khi bắt buộc mà chưa chọn */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => undefined}
          onFocus={() => triggerRef.current?.focus()}
          className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
        />
      )}

      {open && (
        <Portal>
          <div
            ref={popoverRef}
            style={{ ...popoverStyle(pos), maxHeight: pos?.maxHeight, minWidth: 180 }}
            className="z-[80] flex animate-scale-in flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
          >
            {canSearch && (
              <div className="border-b border-line p-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActive(0);
                    }}
                    onKeyDown={onListKey}
                    placeholder="Tìm nhanh..."
                    className="h-9 w-full rounded-lg bg-muted pl-9 pr-3 text-sm outline-none placeholder:text-ink-3"
                  />
                </div>
              </div>
            )}
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              aria-activedescendant={filtered[active] ? `${id}-opt-${active}` : undefined}
              onKeyDown={onListKey}
              className="flex-1 overflow-y-auto overscroll-contain p-1.5 outline-none"
            >
              {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-3">Không có kết quả</li>}
              {filtered.map((opt, i) => {
                const isSel = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    id={`${id}-opt-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={isSel}
                    aria-disabled={opt.disabled}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(opt)}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors',
                      i === active && 'bg-muted',
                      isSel && 'font-semibold',
                      opt.disabled && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    {opt.icon}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{opt.label}</span>
                      {opt.description && <span className="block truncate text-xs font-normal text-ink-3">{opt.description}</span>}
                    </span>
                    {isSel && <Check size={16} className="shrink-0 text-brand-600" />}
                  </li>
                );
              })}
            </ul>
          </div>
        </Portal>
      )}
    </div>
  );

  if (!label && !hint && !error) return <div className={wrapperClassName}>{trigger}</div>;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={wrapperClassName}>
      {trigger}
    </Field>
  );
}
