// Cloud friends: search profiles, send/accept/decline friend requests, and list
// accepted (mutual) friends. Dormant until cloud is on. A friendship row is the
// request: status 'pending' until the recipient accepts. Visibility (feed) is
// mutual — see migrations 0004/0005.

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
  const me = await uid();
  if (!sb || !query.trim()) return [];
  const q = query.trim().replace(/^@/, '');
  const { data } = await sb
    .from('profiles')
    .select('id, username, handle, avatar')
    .or(`handle.ilike.%${q}%,username.ilike.%${q}%`)
    .limit(20);
  // Don't offer to add yourself.
  return ((data ?? []) as CloudFriend[]).filter((p) => p.id !== me);
}

/** Send a friend request (pending until the recipient accepts). */
export async function cloudSendFriendRequest(friendId: string): Promise<void> {
  const sb = await getSupabase();
  const me = await uid();
  if (!sb || !me || friendId === me) return;
  // Don't clobber an existing (possibly accepted) row.
  await sb
    .from('friendships')
    .upsert({ user_id: me, friend_id: friendId, status: 'pending' }, { onConflict: 'user_id,friend_id', ignoreDuplicates: true });
}

/** Incoming friend requests awaiting your acceptance. */
export async function cloudListIncomingRequests(): Promise<CloudFriend[]> {
  const sb = await getSupabase();
  const me = await uid();
  if (!sb || !me) return [];
  const { data } = await sb
    .from('friendships')
    .select('requester:profiles!user_id(id, username, handle, avatar)')
    .eq('friend_id', me)
    .eq('status', 'pending');
  return ((data ?? []) as unknown as { requester: CloudFriend }[])
    .map((r) => r.requester)
    .filter(Boolean);
}

/** Accept an incoming request (makes the friendship mutual). */
export async function cloudAcceptRequest(requesterId: string): Promise<void> {
  const sb = await getSupabase();
  const me = await uid();
  if (!sb || !me) return;
  await sb
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('user_id', requesterId)
    .eq('friend_id', me);
}

/** Decline an incoming request (removes it). */
export async function cloudDeclineRequest(requesterId: string): Promise<void> {
  const sb = await getSupabase();
  const me = await uid();
  if (!sb || !me) return;
  await sb.from('friendships').delete().eq('user_id', requesterId).eq('friend_id', me);
}

/** Your accepted friends (mutual — counts rows in either direction). */
export async function cloudListFriends(): Promise<CloudFriend[]> {
  const sb = await getSupabase();
  const me = await uid();
  if (!sb || !me) return [];
  const { data } = await sb
    .from('friendships')
    .select(
      'user_id, friend_id,' +
        ' requester:profiles!user_id(id, username, handle, avatar),' +
        ' recipient:profiles!friend_id(id, username, handle, avatar)',
    )
    .eq('status', 'accepted')
    .or(`user_id.eq.${me},friend_id.eq.${me}`);
  type Row = { user_id: string; friend_id: string; requester: CloudFriend; recipient: CloudFriend };
  return ((data ?? []) as unknown as Row[])
    .map((r) => (r.user_id === me ? r.recipient : r.requester))
    .filter(Boolean);
}
