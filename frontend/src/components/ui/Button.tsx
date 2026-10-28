import Link from 'next/link';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'brand' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'lime';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-2 active:bg-ink',
  brand: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'bg-muted text-ink hover:bg-line',
  outline: 'border border-line-strong bg-surface text-ink hover:border-ink hover:bg-canvas',
  ghost: 'text-ink-2 hover:bg-muted hover:text-ink',
  danger: 'bg-danger text-white hover:bg-danger-dark',
  lime: 'bg-lime-400 text-ink hover:bg-lime-300',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-base gap-2',
  icon: 'h-11 w-11',
  'icon-sm': 'h-9 w-9',
};

/** Lớp CSS dùng chung — xuất ra để style cả thẻ <a> ngoài (vd link PayOS). */
export function buttonClass({
  variant = 'primary',
  size = 'md',
  block,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; className?: string } = {}) {
  return cn(
    'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full font-semibold',
    'transition-all duration-200 ease-silk active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    block && 'w-full',
    className,
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  /** Hiện spinner + khóa nút trong lúc xử lý. */
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/** Nút bấm chuẩn của hệ thống. Mặc định type="button" để tránh submit form ngoài ý muốn. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, block, loading, leftIcon, rightIcon, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, block, className })}
      {...rest}
    >
      {loading ? <Spinner size="xs" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

interface ButtonLinkProps extends Omit<React.ComponentProps<typeof Link>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/** Link điều hướng mang hình dáng nút. */
export function ButtonLink({ variant, size, block, className, leftIcon, rightIcon, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass({ variant, size, block, className })} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
