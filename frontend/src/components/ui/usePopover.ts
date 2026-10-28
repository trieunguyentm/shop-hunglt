'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

interface Options {
  /** Canh mép popover theo mép trái hoặc phải của trigger. */
  align?: 'start' | 'end';
  /** Bề ngang popover bằng trigger (dropdown chọn) hay tự do (menu). */
  matchWidth?: boolean;
  offset?: number;
  maxHeight?: number;
}

export interface PopoverPosition {
  /** placement=bottom: khoảng cách từ mép trên viewport; placement=top: từ mép dưới. */
  top: number;
  left: number;
  width?: number;
  maxHeight: number;
  placement: 'bottom' | 'top';
}

/**
 * Vị trí popover theo trigger (position: fixed, render qua portal) để không bị
 * cắt bởi container overflow (vd bảng có cuộn ngang). Tự lật lên trên khi thiếu chỗ.
 */
export function usePopover<T extends HTMLElement>({ align = 'start', matchWidth = true, offset = 6, maxHeight = 320 }: Options = {}) {
  const triggerRef = useRef<T>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PopoverPosition | null>(null);

  const update = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const below = vh - r.bottom - offset - 8;
    const above = r.top - offset - 8;
    const placement = below < Math.min(maxHeight, 200) && above > below ? 'top' : 'bottom';
    const mh = Math.max(120, Math.min(maxHeight, placement === 'bottom' ? below : above));
    const popW = popoverRef.current?.offsetWidth ?? r.width;
    let left = align === 'end' ? r.right - (matchWidth ? r.width : popW) : r.left;
    left = Math.max(8, Math.min(left, vw - (matchWidth ? r.width : popW) - 8));
    setPos({
      top: placement === 'bottom' ? r.bottom + offset : vh - r.top + offset,
      left,
      width: matchWidth ? r.width : undefined,
      maxHeight: mh,
      placement,
    });
  }, [align, matchWidth, offset, maxHeight]);

  useLayoutEffect(() => {
    if (!open) return;
    update();
    // Portal mount trễ 1 nhịp → đo lại khi đã có kích thước thật của popover
    const raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [open, update]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('touchstart', onDown);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, update]);

  return { triggerRef, popoverRef, open, setOpen, pos, update };
}

/** Style inline cho popover theo vị trí đã tính. */
export function popoverStyle(pos: PopoverPosition | null): React.CSSProperties {
  if (!pos) return { position: 'fixed', top: -9999, left: -9999, visibility: 'hidden' };
  return {
    position: 'fixed',
    left: pos.left,
    width: pos.width,
    // Lật lên: neo theo cạnh dưới (bottom) — không dùng transform vì animation ghi đè transform
    ...(pos.placement === 'bottom' ? { top: pos.top } : { bottom: pos.top }),
  };
}
