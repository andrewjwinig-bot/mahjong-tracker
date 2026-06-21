// Lazily-created Supabase client, gated entirely on environment variables.
// When NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are absent (the default), this
// returns null and the app runs in its on-device, local-only mode — nothing
// is sent anywhere. Set both vars (and run the migration) to enable cloud.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True only when cloud has been configured via env vars. */
export function isCloudEnabled(): boolean {
  return Boolean(url && anon);
}

let client: SupabaseClient | null = null;

/** The Supabase client, or null when cloud isn't configured. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !anon) return null;
  if (!client) {
    client = createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  }
  return client;
}
