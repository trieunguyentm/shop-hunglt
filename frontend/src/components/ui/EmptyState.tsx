import { cn } from '@/lib/utils';

/** Trạng thái rỗng / lỗi: biểu tượng + tiêu đề + mô tả + hành động. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'neutral' | 'danger';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-14 text-center',
        tone === 'danger' ? 'border-danger/30 bg-danger-soft/40' : 'border-line-strong bg-surface',
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            'mb-4 grid h-14 w-14 place-items-center rounded-2xl',
            tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-lime-400 text-ink',
          )}
        >
          {icon}
        </span>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-3">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
