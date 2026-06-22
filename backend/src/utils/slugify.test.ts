import { describe, expect, it } from 'vitest';
import { slugify, uniqueSlug } from './slugify';

describe('slugify', () => {
  it('bỏ dấu tiếng Việt và chuyển gạch nối', () => {
    expect(slugify('Áo thun cotton oversize')).toBe('ao-thun-cotton-oversize');
    expect(slugify('Đầm suông tối giản')).toBe('dam-suong-toi-gian');
  });

  it('xử lý ký tự đặc biệt & khoảng trắng thừa', () => {
    expect(slugify('  Quần Jean / Slim-fit!! ')).toBe('quan-jean-slim-fit');
  });
});

describe('uniqueSlug', () => {
  it('giữ nguyên khi chưa tồn tại', async () => {
    const slug = await uniqueSlug('Áo sơ mi', async () => false);
    expect(slug).toBe('ao-so-mi');
  });

  it('thêm hậu tố khi bị trùng', async () => {
    const taken = new Set(['ao-so-mi', 'ao-so-mi-2']);
    const slug = await uniqueSlug('Áo sơ mi', async (s) => taken.has(s));
    expect(slug).toBe('ao-so-mi-3');
  });
});
