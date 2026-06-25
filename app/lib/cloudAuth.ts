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
