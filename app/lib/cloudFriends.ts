// Cloud sync for friends (find by handle + add). Dormant until cloud is on.

import { getSupabase } from './supabase';
import type { TileAvatar } from './social';

export interface CloudFriend {
  id: string;
  username: string;
  handle: string;
  avatar: TileAvatar;
}

async function uid(): Promise<string | null> {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

/** Find profiles by username/handle (for "search who has an account"). */
export async function cloudSearchProfiles(query: string): Promise<CloudFriend[]> {
  const sb = await getSupabase();
  if (!sb || !query.trim()) return [];
  const q = query.trim().replace(/^@/, '');
  const { data } = await sb
    .from('profiles')
    .select('id, username, handle, avatar')
    .or(`handle.ilike.%${q}%,username.ilike.%${q}%`)
    .limit(20);
  return (data ?? []) as CloudFriend[];
}

export async function cloudListFriends(): Promise<CloudFriend[]> {
  const sb = await getSupabase();
  const id = await uid();
  if (!sb || !id) return [];
  const { data } = await sb
    .from('friendships')
    .select('friend:profiles!friend_id(id, username, handle, avatar)')
    .eq('user_id', id);
  return ((data ?? []) as unknown as { friend: CloudFriend }[]).map((r) => r.friend).filter(Boolean);
}

export async function cloudAddFriend(friendId: string): Promise<void> {
  const sb = await getSupabase();
  const id = await uid();
  if (!sb || !id) return;
  await sb.from('friendships').insert({ user_id: id, friend_id: friendId });
}
