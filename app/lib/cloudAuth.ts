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

function client() {
  const sb = getSupabase();
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
  const { data, error } = await client().auth.signUp({
    email,
    password,
    options: { data: { username, handle: username.toLowerCase(), experience } },
  });
  if (error) throw error;
  const u = data.user;
  return { id: u?.id ?? '', email: u?.email ?? null };
}

export async function cloudSignIn(email: string, password: string): Promise<CloudUser> {
  const { data, error } = await client().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { id: data.user.id, email: data.user.email ?? null };
}

export async function cloudSignOut(): Promise<void> {
  await client().auth.signOut();
}

export async function cloudCurrentUser(): Promise<CloudUser | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
}

/** Read the signed-in user's profile row. */
export async function cloudGetProfile(): Promise<CloudProfile | null> {
  const sb = getSupabase();
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
 * Delete the signed-in user's data and sign out. Removing the underlying auth
 * record requires a server-side function (service role) — see docs/backend.md;
 * deleting the profile row cascades and removes all of the user's content.
 */
export async function cloudDeleteAccount(): Promise<void> {
  const sb = client();
  const { data } = await sb.auth.getUser();
  if (data.user) await sb.from('profiles').delete().eq('id', data.user.id);
  await sb.auth.signOut();
}
