import { cn } from '@/lib/utils';

export type BadgeTone = 'neutral' | 'brand' | 'lime' | 'success' | 'warning' | 'danger' | 'info' | 'dark';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-ink-2',
  brand: 'bg-brand-50 text-brand-700',
  lime: 'bg-lime-400 text-ink',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  dark: 'bg-ink text-white',
};

/** Nhãn trạng thái nhỏ dạng viên thuốc. `dot` thêm chấm tròn phía trước. */
export function Badge({
  tone = 'neutral',
  dot,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
