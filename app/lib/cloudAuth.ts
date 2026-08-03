// Cloud authentication (Supabase), gated behind isCloudEnabled(). Every call
// throws CLOUD_DISABLED when cloud isn't configured, so callers can fall back
// to local mode. No data is sent anywhere until env vars are set.

import { getSupabase, isCloudEnabled } from './supabase';
import type { Experience } from './account';

export const CLOUD_DISABLED = 'CLOUD_DISABLED';

export interface CloudUser {
  id: string;
  email: string | null;
  /**
   * True when sign-up created the account but no session was returned — i.e.
   * the Supabase project has "Confirm email" enabled and the user must click
   * the link in their inbox before they can sign in. Callers must NOT treat
   * this as a completed login.
   */
  needsConfirmation?: boolean;
}

/**
 * Turn a Supabase auth error (or anything thrown) into a short, actionable,
 * never-empty message. Supabase surfaces terse codes/messages like
 * "Invalid login credentials"; we map the common ones to plain guidance so the
 * user is never left staring at a blank or cryptic failure.
 */
export function authErrorMessage(e: unknown): string {
  const raw =
    (e as { message?: string; code?: string; error_description?: string } | null)?.message ||
    (e as { error_description?: string } | null)?.error_description ||
    '';
  const code = (e as { code?: string } | null)?.code || '';
  const m = `${code} ${raw}`.toLowerCase();

  if (m.includes('email not confirmed') || m.includes('email_not_confirmed'))
    return 'Please confirm your email first — check your inbox for the confirmation link, then sign in.';
  if (m.includes('invalid login') || m.includes('invalid_credentials'))
    return 'That email and password don’t match. Double-check them, or create a new account.';
  if (m.includes('already registered') || m.includes('user_already_exists'))
    return 'An account with this email already exists. Try signing in instead.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Too many attempts. Wait a minute and try again.';
  // "Failed to fetch" (Chrome), "Load failed" (Safari/WebKit & iOS), and
  // "NetworkError" (Firefox) all mean the request never reached the server —
  // no connection, a paused/misconfigured backend, or a blocked origin.
  if (
    m.includes('failed to fetch') ||
    m.includes('load failed') ||
    m.includes('networkerror') ||
    m.includes('network')
  )
    return 'Can’t reach the server. Check your connection and try again in a moment.';
  return raw || 'Something went wrong. Please try again.';
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
  // No session means "Confirm email" is on: the account exists but can't be
  // used until the emailed link is clicked. Signal that up so the UI doesn't
  // pretend the user is logged in.
  return { id: u?.id ?? '', email: u?.email ?? null, needsConfirmation: !data.session };
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
