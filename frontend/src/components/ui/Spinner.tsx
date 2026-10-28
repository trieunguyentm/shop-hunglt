import { cn } from '@/lib/utils';

const SIZES = { xs: 'h-3.5 w-3.5 border-[1.5px]', sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-10 w-10 border-[3px]' };

/** Vòng xoay tải dữ liệu — kế thừa màu chữ hiện tại (currentColor). */
export function Spinner({ size = 'sm', className }: { size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      role="status"
      aria-label="Đang tải"
      className={cn(
        'inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent',
        SIZES[size],
        className,
      )}
    />
  );
}

/** Khối tải toàn vùng: spinner + nhãn, căn giữa. */
export function LoadingBlock({ label = 'Đang tải...', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-ink-3', className)}>
      <Spinner size="md" className="text-brand-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
