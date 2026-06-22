import type { MetadataRoute } from 'next';

const BASE = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Không cho index khu vực riêng tư
      disallow: ['/admin', '/account', '/cart', '/checkout', '/orders'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
