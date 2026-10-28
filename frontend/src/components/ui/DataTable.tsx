'use client';

import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableRowsSkeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Ẩn cột ở màn hình nhỏ để bảng gọn hơn. */
  hideOnMobile?: boolean;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  footer?: React.ReactNode;
}

const alignCls = { left: 'text-left', right: 'text-right', center: 'text-center' };

/** Bảng dữ liệu chuẩn cho khu quản trị: skeleton khi tải, trạng thái rỗng, click dòng. */
export function DataTable<T>({ columns, rows, rowKey, loading, emptyTitle = 'Chưa có dữ liệu', emptyDescription, onRowClick, footer }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-canvas">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-3',
                    alignCls[c.align ?? 'left'],
                    c.hideOnMobile && 'hidden md:table-cell',
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableRowsSkeleton cols={columns.length} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14">
                  <div className="flex flex-col items-center text-center">
                    <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-muted text-ink-3">
                      <Inbox size={22} />
                    </span>
                    <p className="font-semibold text-ink">{emptyTitle}</p>
                    {emptyDescription && <p className="mt-1 text-sm text-ink-3">{emptyDescription}</p>}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-t border-line transition-colors',
                    onRowClick ? 'cursor-pointer hover:bg-canvas' : 'hover:bg-canvas/60',
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        'px-4 py-3.5 align-middle',
                        alignCls[c.align ?? 'left'],
                        c.hideOnMobile && 'hidden md:table-cell',
                        c.className,
                      )}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer && <div className="border-t border-line px-4 py-3">{footer}</div>}
    </div>
  );
}
