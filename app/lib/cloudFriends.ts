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
  lastSeenAt?: string | null;
}

/** An incoming request enriched with how many friends you share. */
export interface CloudRequest extends CloudFriend {
  mutualCount: number;
}

/** A suggested player with the trust signals the Friends screen renders. */
export interface CloudSuggestion extends CloudFriend {
  mutualCount: number;
  gamesTogether: number;
}

/** ~90s TTL: derive an "online" flag + relative "last seen" from a timestamp. */
export function presenceFromLastSeen(lastSeenAt?: string | null): { online: boolean; last?: string } {
  if (!lastSeenAt) return { online: false };
  const t = new Date(lastSeenAt).getTime();
  if (Number.isNaN(t)) return { online: false };
  const secs = (Date.now() - t) / 1000;
  if (secs < 90) return { online: true };
  const mins = Math.floor(secs / 60);
  if (mins < 60) return { online: false, last: `${mins}m` };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { online: false, last: `${hrs}h` };
  const days = Math.floor(hrs / 24);
  if (days < 7) return { online: false, last: `${days}d` };
  return { online: false, last: `${Math.floor(days / 7)}w` };
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

/** Your accepted friends (mutual — counts rows in either direction). Includes
 *  each friend's last_seen_at so the UI can show presence. */
export async function cloudListFriends(): Promise<CloudFriend[]> {
  const sb = await getSupabase();
  const me = await uid();
  if (!sb || !me) return [];
  const { data } = await sb
    .from('friendships')
    .select(
      'user_id, friend_id,' +
        ' requester:profiles!user_id(id, username, handle, avatar, last_seen_at),' +
        ' recipient:profiles!friend_id(id, username, handle, avatar, last_seen_at)',
    )
    .eq('status', 'accepted')
    .or(`user_id.eq.${me},friend_id.eq.${me}`);
  type P = { id: string; username: string; handle: string; avatar: TileAvatar; last_seen_at?: string | null };
  type Row = { user_id: string; friend_id: string; requester: P; recipient: P };
  return ((data ?? []) as unknown as Row[])
    .map((r) => (r.user_id === me ? r.recipient : r.requester))
    .filter(Boolean)
    .map((p) => ({ id: p.id, username: p.username, handle: p.handle, avatar: p.avatar, lastSeenAt: p.last_seen_at }));
}

/** Heartbeat — call on app foreground and on a throttled interval. */
export async function cloudTouchPresence(): Promise<void> {
  const sb = await getSupabase();
  if (!sb) return;
  await sb.rpc('touch_presence');
}

/** Incoming requests with mutual-friend counts (via the incoming_requests RPC). */
export async function cloudListRequests(): Promise<CloudRequest[]> {
  const sb = await getSupabase();
  const me = await uid();
  if (!sb || !me) return [];
  const { data } = await sb.rpc('incoming_requests');
  type R = { id: string; username: string; handle: string; avatar: TileAvatar; mutual_count: number };
  return ((data ?? []) as R[]).map((r) => ({ id: r.id, username: r.username, handle: r.handle, avatar: r.avatar, mutualCount: r.mutual_count ?? 0 }));
}

/** Suggested players (friends-of-friends + shared-table players). */
export async function cloudListSuggestions(limit = 12): Promise<CloudSuggestion[]> {
  const sb = await getSupabase();
  const me = await uid();
  if (!sb || !me) return [];
  const { data } = await sb.rpc('friend_suggestions', { lim: limit });
  type S = { id: string; username: string; handle: string; avatar: TileAvatar; mutual_count: number; games_together: number };
  return ((data ?? []) as S[]).map((s) => ({ id: s.id, username: s.username, handle: s.handle, avatar: s.avatar, mutualCount: s.mutual_count ?? 0, gamesTogether: s.games_together ?? 0 }));
}
