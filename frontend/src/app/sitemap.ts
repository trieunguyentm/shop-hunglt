import type { MetadataRoute } from 'next';
import { getProducts } from '@/lib/api';

const BASE = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/login`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/register`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Trang chi tiết sản phẩm (nếu API sẵn sàng)
  try {
    const res = await getProducts({ pageSize: 100 });
    const products = res.data.map((p) => ({
      url: `${BASE}/products/${p.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
    return [...staticRoutes, ...products];
  } catch {
    return staticRoutes;
  }
}
