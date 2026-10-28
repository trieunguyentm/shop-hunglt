import { describe, expect, it } from 'vitest';
import { canTransition, shouldRestock } from './order.rules';

describe('order.rules', () => {
  it('cho phép luồng tiến PENDING → … → DELIVERED', () => {
    expect(canTransition('PENDING', 'CONFIRMED')).toBe(true);
    expect(canTransition('CONFIRMED', 'PACKING')).toBe(true);
    expect(canTransition('PACKING', 'SHIPPING')).toBe(true);
    expect(canTransition('SHIPPING', 'DELIVERED')).toBe(true);
  });

  it('chặn bước lùi và mở lại đơn đã hủy', () => {
    expect(canTransition('CANCELLED', 'PENDING')).toBe(false);
    expect(canTransition('DELIVERED', 'PENDING')).toBe(false);
    expect(canTransition('SHIPPING', 'CANCELLED')).toBe(false);
  });

  it('hoàn kho khi hủy hoặc trả hàng', () => {
    expect(shouldRestock('CANCELLED')).toBe(true);
    expect(shouldRestock('RETURNED')).toBe(true);
    expect(shouldRestock('DELIVERED')).toBe(false);
  });
});
