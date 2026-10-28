import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * twMerge cần biết cỡ chữ tùy biến (text-2xs) thuộc nhóm "font-size", nếu không sẽ coi
 * là màu chữ và gộp nhầm với text-ink...
 */
const merge = extendTailwindMerge({ extend: { classGroups: { 'font-size': [{ text: ['2xs'] }] } } });

/** Gộp className có điều kiện + dedupe class Tailwind xung đột. */
export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs));
}

/** Định dạng tiền tệ VND. */
export function formatVND(amount: number | string): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

/** 28/10/2026 */
export function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** 14:05 · 28/10/2026 */
export function formatDateTime(iso: string | Date): string {
  const d = new Date(iso);
  return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${formatDate(d)}`;
}

/** Lấy thông điệp lỗi an toàn từ giá trị bị ném. */
export function errorMessage(e: unknown, fallback = 'Đã có lỗi xảy ra'): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', 'FREESIZE', 'FREE SIZE'];

/** Sắp size theo thứ tự chuẩn (XS → XXL), size số (28, 29...) tăng dần, còn lại theo bảng chữ cái. */
export function sortSizes(sizes: string[]): string[] {
  const rank = (s: string) => {
    const i = SIZE_ORDER.indexOf(s.trim().toUpperCase());
    if (i >= 0) return i;
    const n = Number(s);
    return Number.isFinite(n) ? 100 + n : 1000;
  };
  return [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'vi'));
}
