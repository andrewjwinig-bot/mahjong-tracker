/** @type {import('next').NextConfig} */

// Proxy the backend through our own origin so networks that block the
// supabase.co domain (corporate/school Wi‑Fi, some content blockers, iOS
// Private Relay) can't break sign-in or sync. The browser only ever talks to
// our own domain; Vercel forwards /sb/* to the real Supabase project
// server-side. Paired with app/lib/supabase.ts, which points the client at
// `${origin}/sb` in the browser.
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!SUPABASE_URL) return [];
    return [{ source: '/sb/:path*', destination: `${SUPABASE_URL}/:path*` }];
  },
};

export default nextConfig;
