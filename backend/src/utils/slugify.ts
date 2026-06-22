/** Chuyển chuỗi tiếng Việt thành slug URL-friendly (bỏ dấu, gạch nối). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Sinh slug duy nhất: thử slug gốc, nếu trùng thì thêm hậu tố -2, -3...
 * `exists` là hàm kiểm tra slug đã tồn tại chưa (thường truy vấn DB).
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'item';
  let candidate = root;
  let i = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${i}`;
    i += 1;
  }
  return candidate;
}
