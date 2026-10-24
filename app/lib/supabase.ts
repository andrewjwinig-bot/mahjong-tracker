// Lazily-created Supabase client, gated entirely on environment variables AND
// code-split: the @supabase/supabase-js library is only downloaded when cloud
// is configured. When the env vars are absent (the default), getSupabase()
// resolves to null and the app runs in on-device, local-only mode — nothing is
// sent anywhere and the library isn't loaded.

import type { SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True only when cloud has been configured via env vars. */
export function isCloudEnabled(): boolean {
  return Boolean(rawUrl && anon);
}

// In the browser, talk to Supabase through our OWN origin (/sb/*), which a
// Next.js rewrite (see next.config.js) proxies to the real project server-side.
// Keeping every request on our own domain means a network that blocks the
// supabase.co host — corporate/school Wi‑Fi, content blockers, iOS Private
// Relay — can't break sign-in or sync, since it demonstrably lets our own
// domain through (the app loaded). On the server (build/SSR, no browser network
// involved) we use the project URL directly.
function resolveUrl(): string | undefined {
  if (!rawUrl) return undefined;
  if (typeof window !== 'undefined') return `${window.location.origin}/sb`;
  return rawUrl;
}

let clientPromise: Promise<SupabaseClient | null> | null = null;

/** The Supabase client (loaded on demand), or null when cloud isn't configured. */
export function getSupabase(): Promise<SupabaseClient | null> {
  const url = resolveUrl();
  if (!url || !anon) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(url, anon, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      }),
    );
  }
  return clientPromise;
}
