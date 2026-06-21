// Lazily-created Supabase client, gated entirely on environment variables AND
// code-split: the @supabase/supabase-js library is only downloaded when cloud
// is configured. When the env vars are absent (the default), getSupabase()
// resolves to null and the app runs in on-device, local-only mode — nothing is
// sent anywhere and the library isn't loaded.

import type { SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True only when cloud has been configured via env vars. */
export function isCloudEnabled(): boolean {
  return Boolean(url && anon);
}

let clientPromise: Promise<SupabaseClient | null> | null = null;

/** The Supabase client (loaded on demand), or null when cloud isn't configured. */
export function getSupabase(): Promise<SupabaseClient | null> {
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
