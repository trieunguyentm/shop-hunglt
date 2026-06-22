import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline';

interface BaseProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}

const styles: Record<Variant, string> = {
  primary: 'btn-primary',
  outline: 'btn-outline',
};

/** Nút dạng <a> (điều hướng). */
export function ButtonLink({
  href,
  variant = 'primary',
  className,
  children,
}: BaseProps & { href: string }) {
  return (
    <Link href={href} className={cn(styles[variant], className)}>
      {children}
    </Link>
  );
}

/** Nút dạng <button>. */
export function Button({
  variant = 'primary',
  className,
  children,
  ...rest
}: BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(styles[variant], className)} {...rest}>
      {children}
    </button>
  );
}
