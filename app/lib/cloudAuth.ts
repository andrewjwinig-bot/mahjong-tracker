// Cloud authentication (Supabase), gated behind isCloudEnabled(). Every call
// throws CLOUD_DISABLED when cloud isn't configured, so callers can fall back
// to local mode. No data is sent anywhere until env vars are set.

import { getSupabase, isCloudEnabled } from './supabase';
import type { Experience } from './account';

export const CLOUD_DISABLED = 'CLOUD_DISABLED';

export interface CloudUser {
  id: string;
  email: string | null;
}

export interface CloudProfile {
  username: string;
  handle: string;
  bio: string;
  experience: Experience;
  avatar: { face: string; char?: string; color: string };
}

async function client() {
  const sb = await getSupabase();
  if (!sb) throw new Error(CLOUD_DISABLED);
  return sb;
}

export { isCloudEnabled };

/**
 * Turn a raw Supabase/auth/network error into a friendly, user-facing line.
 * The most important case: when the backend is unreachable (a paused project,
 * no connection, a 5xx gateway), say so plainly instead of leaking a technical
 * "Failed to fetch" that reads like the app itself is broken.
 */
export function authErrorMessage(e: unknown, mode: 'signup' | 'signin'): string {
  const err = (e ?? {}) as { message?: string; status?: number; code?: string; name?: string };
  const msg = (err.message ?? '').toLowerCase();
  const code = (err.code ?? '').toLowerCase();
  const name = (err.name ?? '').toLowerCase();

  // Backend unreachable: paused project, offline, DNS/TLS failure, 429, or 5xx.
  const networkish =
    name.includes('retryable') ||
    err.status === 0 ||
    err.status === 429 ||
    (typeof err.status === 'number' && err.status >= 500) ||
    /failed to fetch|load failed|networkerror|network request failed|fetch failed|timed? ?out|econn|enotfound|dns|unreachable|offline/.test(
      msg,
    );
  if (networkish) {
    return "Can’t reach our servers right now. Check your connection and try again in a moment.";
  }

  if (mode === 'signin') {
    if (code.includes('invalid_credentials') || msg.includes('invalid login')) {
      return 'That email or password doesn’t match. Give it another try.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Please confirm your email first, then sign in.';
    }
  } else {
    if (
      code.includes('user_already_exists') ||
      msg.includes('already registered') ||
      msg.includes('already been registered')
    ) {
      return 'An account with this email already exists — sign in instead.';
    }
    if (msg.includes('password') && /least|weak|short|6 char/.test(msg)) {
      return 'Please choose a password with at least 6 characters.';
    }
    if (code.includes('email_address_invalid') || msg.includes('valid email') || msg.includes('invalid email')) {
      return 'That email doesn’t look right — double-check it and try again.';
    }
  }

  // Fall back to the server's own message, or a plain generic line.
  return err.message || 'Something went wrong. Please try again.';
}

export async function cloudSignUp(
  email: string,
  password: string,
  username: string,
  experience: Experience,
): Promise<CloudUser> {
  const sb = await client();
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { username, handle: username.toLowerCase(), experience } },
  });
  if (error) throw error;
  const u = data.user;
  // The DB trigger seeds the profile row with a *default* experience; now that
  // we're authenticated, write the level the user actually chose so it syncs
  // across devices. Best-effort — experience also lives in the local account.
  if (u?.id) {
    try {
      await sb.from('profiles').update({ experience }).eq('id', u.id);
    } catch {
      /* ignore — not worth blocking sign-up over */
    }
  }
  return { id: u?.id ?? '', email: u?.email ?? null };
}

export async function cloudSignIn(email: string, password: string): Promise<CloudUser> {
  const sb = await client();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { id: data.user.id, email: data.user.email ?? null };
}

export async function cloudSignOut(): Promise<void> {
  await (await client()).auth.signOut();
}

export async function cloudCurrentUser(): Promise<CloudUser | null> {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
}

/** Read the signed-in user's profile row. */
export async function cloudGetProfile(): Promise<CloudProfile | null> {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await sb
    .from('profiles')
    .select('username, handle, bio, experience, avatar')
    .eq('id', u.user.id)
    .single();
  if (error || !data) return null;
  return data as CloudProfile;
}

/**
 * Fully delete the signed-in user's account. Invokes the `delete-account` edge
 * function, which (with the service role) removes the underlying auth user —
 * that cascade-deletes the profile row and every piece of the user's data. This
 * is what makes in-app account deletion an actual *account* deletion (an App
 * Store requirement), not just a data wipe. Requires the function to be
 * deployed: `supabase functions deploy delete-account`.
 */
export async function cloudDeleteAccount(): Promise<void> {
  const sb = await client();
  const { error } = await sb.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw error;
  await sb.auth.signOut();
}
