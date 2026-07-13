import type { MetadataRoute } from 'next';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://clubmahj.vercel.app'
).replace(/\/+$/, '');

// The app is a single-page PWA; only the marketing/legal routes are worth
// indexing. The in-app tabs live under / and aren't separately routable.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/support`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
