// Supabase Edge Function — fully delete the calling user's account.
//
// The client (signed in) calls this with its JWT; the function uses the service
// role key to delete the auth user, which cascade-deletes all of that user's
// rows (profiles + everything referencing it). This is what makes in-app
// "delete my account" actually remove the account record (an App Store
// requirement) rather than just the data rows.
//
// Deploy:
//   supabase functions deploy delete-account
// Secrets (set once):
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...   (SUPABASE_URL / ANON are provided)
//
// NOTE: Deno runtime — this file is excluded from the Next.js type-check.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    // Identify the caller from their JWT.
    const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const {
      data: { user },
    } = await asUser.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401, headers: cors });

    // Admin client deletes the auth user (cascades to their data).
    const admin = createClient(url, service);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return new Response(error.message, { status: 500, headers: cors });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(String(e), { status: 500, headers: cors });
  }
});
