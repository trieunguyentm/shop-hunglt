'use client';

import { forwardRef, useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Lớp nền chung cho ô nhập — dùng lại ở Select để đồng bộ kích thước/viền/focus. */
export const fieldBase =
  'w-full rounded-xl border bg-surface text-sm text-ink transition-[border-color,box-shadow] duration-200 ' +
  'placeholder:text-ink-3 hover:border-ink-4 focus:border-ink focus:shadow-ring focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:bg-muted disabled:text-ink-3';

export const fieldSizes = { sm: 'h-9 px-3', md: 'h-11 px-4' } as const;

/** Bọc nhãn + mô tả + thông báo lỗi quanh một control. */
export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
          {label}
          {required && <span className="ml-0.5 text-brand-600">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  size?: keyof typeof fieldSizes;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, size = 'md', leftIcon, rightSlot, className, wrapperClassName, id, required, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const control = (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3">{leftIcon}</span>
      )}
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(
          fieldBase,
          fieldSizes[size],
          error ? 'border-danger' : 'border-line',
          leftIcon && 'pl-10',
          rightSlot && 'pr-12',
          className,
        )}
        {...rest}
      />
      {rightSlot && <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{rightSlot}</span>}
    </div>
  );
  if (!label && !hint && !error) return <div className={wrapperClassName}>{control}</div>;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={wrapperClassName}>
      {control}
    </Field>
  );
});

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, wrapperClassName, id, required, rows = 4, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        className={cn(fieldBase, 'resize-y px-4 py-3 leading-relaxed', error ? 'border-danger' : 'border-line', className)}
        {...rest}
      />
    </Field>
  );
});

/** Ô tích chọn tùy biến. */
export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={cn('group flex cursor-pointer items-start gap-3', disabled && 'cursor-not-allowed opacity-60', className)}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={cn(
          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2',
          checked ? 'border-ink bg-ink text-white' : 'border-line-strong bg-surface group-hover:border-ink-3',
        )}
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
      <span className="text-sm">
        <span className="font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-ink-3">{description}</span>}
      </span>
    </label>
  );
}

/** Công tắc bật/tắt. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-3', disabled && 'cursor-not-allowed opacity-60')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-ink' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-transform duration-200 ease-silk',
            checked && 'translate-x-5',
          )}
        />
      </button>
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
    </label>
  );
}

/** Lựa chọn dạng thẻ (radio) — dùng cho phương thức thanh toán, giao hàng... */
export function RadioCard({
  name,
  checked,
  onChange,
  title,
  description,
  icon,
  disabled,
  aside,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  aside?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer items-center gap-4 rounded-2xl border bg-surface p-4 transition-all duration-200',
        checked ? 'border-ink shadow-[0_0_0_1px_theme(colors.ink.DEFAULT)]' : 'border-line hover:border-ink-4',
        disabled && 'cursor-not-allowed opacity-50 hover:border-line',
      )}
    >
      <input type="radio" name={name} className="peer sr-only" checked={checked} disabled={disabled} onChange={onChange} />
      <span
        className={cn(
          'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2',
          checked ? 'border-ink' : 'border-line-strong',
        )}
      >
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
      </span>
      {icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-ink">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        {description && <span className="mt-0.5 block text-xs text-ink-3">{description}</span>}
      </span>
      {aside}
    </label>
  );
}
