// Cloud sync for the public feed: posts (incl. milestone banners), likes,
// comments, plus moderation (block + report). Dormant until cloud is
// configured. The embedded selects rely on the FK relationships in
// 0001_init.sql (posts.user_id / comments.user_id -> profiles.id).

import { getSupabase } from './supabase';
import type { TileAvatar } from './social';
import type { FeedKind } from './social';

async function uid(): Promise<string | null> {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

export interface CloudComment {
  id: string;
  text: string;
  createdAt: number;
  author: string;
  avatar: TileAvatar;
}

export interface CloudPost {
  id: string;
  authorId: string;
  memberName: string;
  avatar: TileAvatar;
  handLabel: string | null;
  note: string;
  photoUrl: string | null;
  createdAt: number;
  likes: number;
  likedByMe: boolean;
  comments: CloudComment[];
  kind?: FeedKind;
  title?: string;
  eyebrow?: string;
  progress?: string;
  place?: string;
}

type Row = {
  id: string;
  user_id: string;
  hand_label: string | null;
  note: string | null;
  photo_url: string | null;
  kind: string | null;
  title: string | null;
  eyebrow: string | null;
  progress: string | null;
  place: string | null;
  created_at: string;
  author: { username: string; avatar: TileAvatar } | null;
  post_likes: { user_id: string }[];
  comments: {
    id: string;
    text: string;
    created_at: string;
    author: { username: string; avatar: TileAvatar } | null;
  }[];
};

const FALLBACK_AVATAR: TileAvatar = { face: 'letter', char: '?', color: '#0EAD96' };

/** User ids the caller has blocked (their posts are hidden from the feed). */
export async function cloudListBlocked(): Promise<string[]> {
  const sb = await getSupabase();
  const me = await uid();
  if (!sb || !me) return [];
  const { data } = await sb.from('blocks').select('blocked_id').eq('blocker_id', me);
  return (data ?? []).map((r) => r.blocked_id as string);
}

export async function cloudListFeed(): Promise<CloudPost[]> {
  const sb = await getSupabase();
  const me = await uid();
  if (!sb) return [];
  const [{ data, error }, blocked] = await Promise.all([
    sb
      .from('posts')
      .select(
        'id, user_id, hand_label, note, photo_url, kind, title, eyebrow, progress, place, created_at,' +
          ' author:profiles!user_id(username, avatar),' +
          ' post_likes(user_id),' +
          ' comments(id, text, created_at, author:profiles!user_id(username, avatar))',
      )
      .order('created_at', { ascending: false })
      .limit(100),
    cloudListBlocked(),
  ]);
  if (error) {
    // Temporary: surface the exact PostgREST error while we verify the feed.
    console.error('[cloudListFeed] query error:', error.message, error);
    return [];
  }
  if (!data) return [];
  const blockedSet = new Set(blocked);

  return (data as unknown as Row[])
    .filter((r) => !blockedSet.has(r.user_id))
    .map((r) => ({
      id: r.id,
      authorId: r.user_id,
      memberName: r.author?.username ?? 'Player',
      avatar: r.author?.avatar ?? FALLBACK_AVATAR,
      handLabel: r.hand_label,
      note: r.note ?? '',
      photoUrl: r.photo_url,
      createdAt: new Date(r.created_at).getTime(),
      likes: r.post_likes?.length ?? 0,
      likedByMe: !!me && (r.post_likes ?? []).some((l) => l.user_id === me),
      comments: (r.comments ?? []).map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: new Date(c.created_at).getTime(),
        author: c.author?.username ?? 'Player',
        avatar: c.author?.avatar ?? FALLBACK_AVATAR,
      })),
      kind: (r.kind as FeedKind) ?? undefined,
      title: r.title ?? undefined,
      eyebrow: r.eyebrow ?? undefined,
      progress: r.progress ?? undefined,
      place: r.place ?? undefined,
    }));
}

export async function cloudCreatePost(p: {
  id: string;
  handLabel: string | null;
  note: string;
  photoUrl: string | null;
  kind?: FeedKind;
  title?: string;
  eyebrow?: string;
  progress?: string;
  place?: string;
}): Promise<void> {
  const sb = await getSupabase();
  const id = await uid();
  if (!sb || !id) return;
  await sb.from('posts').insert({
    id: p.id,
    user_id: id,
    hand_label: p.handLabel,
    note: p.note,
    photo_url: p.photoUrl,
    kind: p.kind ?? null,
    title: p.title ?? null,
    eyebrow: p.eyebrow ?? null,
    progress: p.progress ?? null,
    place: p.place ?? null,
  });
}

export async function cloudToggleLike(postId: string, liked: boolean): Promise<void> {
  const sb = await getSupabase();
  const id = await uid();
  if (!sb || !id) return;
  if (liked) await sb.from('post_likes').insert({ post_id: postId, user_id: id });
  else await sb.from('post_likes').delete().eq('post_id', postId).eq('user_id', id);
}

export async function cloudAddComment(postId: string, text: string): Promise<void> {
  const sb = await getSupabase();
  const id = await uid();
  if (!sb || !id) return;
  await sb.from('comments').insert({ post_id: postId, user_id: id, text });
}

/** Hide all of a user's content from the caller's feed. */
export async function cloudBlockUser(userId: string): Promise<void> {
  const sb = await getSupabase();
  const me = await uid();
  if (!sb || !me || userId === me) return;
  await sb.from('blocks').upsert({ blocker_id: me, blocked_id: userId });
}

/** Flag a post for moderation review. */
export async function cloudReportPost(postId: string, authorId: string, reason = ''): Promise<void> {
  const sb = await getSupabase();
  const me = await uid();
  if (!sb || !me) return;
  await sb.from('reports').insert({
    reporter_id: me,
    post_id: postId,
    reported_user_id: authorId,
    reason,
  });
}
