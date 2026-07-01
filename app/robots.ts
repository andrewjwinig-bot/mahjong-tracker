import type { MetadataRoute } from 'next';

// Mirrors the SITE_URL fallback in layout.tsx — set NEXT_PUBLIC_SITE_URL to the
// production domain before launch so the sitemap/host point at the real site.
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://mahjong-tracker-kappa.vercel.app'
).replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
