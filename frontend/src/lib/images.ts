/** Ảnh dự phòng khi sản phẩm chưa có ảnh. */
export const PLACEHOLDER_IMAGE = '/placeholder-product.svg';

/** Ảnh minh họa giao diện (Unsplash — miễn phí sử dụng). */
export const SITE_IMAGES = {
  hero: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1745240261519-0b988d54d098?auto=format&fit=crop&w=900&q=80'],
  story: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',
  collections: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=80',
  auth: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=900&q=80',
};

/** Ảnh đại diện theo slug danh mục. */
export const CATEGORY_IMAGES: Record<string, string> = {
  'ao': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80',
  'quan': 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80',
  'dam-vay': 'https://images.unsplash.com/photo-1659297949927-06fa02629af0?auto=format&fit=crop&w=900&q=80',
  'phu-kien': 'https://images.unsplash.com/photo-1590548784585-643d2b9f2925?auto=format&fit=crop&w=900&q=80',
};

/** Ảnh danh mục, có dự phòng khi slug lạ (danh mục do admin tạo thêm). */
export function categoryImage(slug: string): string {
  return CATEGORY_IMAGES[slug] ?? SITE_IMAGES.story;
}
