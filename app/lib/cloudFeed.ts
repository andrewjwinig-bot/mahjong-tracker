// Cloud sync for the public feed: posts, likes, comments. Dormant until cloud
// is configured. The embedded selects rely on the FK relationships in
// 0001_init.sql (posts.user_id / comments.user_id -> profiles.id); adjust the
// relationship hints if Supabase reports an ambiguous embed.

import { getSupabase } from './supabase';
import type { TileAvatar } from './social';

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
  memberName: string;
  avatar: TileAvatar;
  handLabel: string | null;
  note: string;
  photoUrl: string | null;
  createdAt: number;
  likes: number;
  likedByMe: boolean;
  comments: CloudComment[];
}

type Row = {
  id: string;
  hand_label: string | null;
  note: string | null;
  photo_url: string | null;
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

export async function cloudListFeed(): Promise<CloudPost[]> {
  const sb = await getSupabase();
  const me = await uid();
  if (!sb) return [];
  const { data, error } = await sb
    .from('posts')
    .select(
      'id, hand_label, note, photo_url, created_at,' +
        ' author:profiles!user_id(username, avatar),' +
        ' post_likes(user_id),' +
        ' comments(id, text, created_at, author:profiles!user_id(username, avatar))',
    )
    .order('created_at', { ascending: false })
    .limit(100);
  if (error || !data) return [];

  return (data as unknown as Row[]).map((r) => ({
    id: r.id,
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
  }));
}

export async function cloudCreatePost(p: {
  handLabel: string | null;
  note: string;
  photoUrl: string | null;
}): Promise<void> {
  const sb = await getSupabase();
  const id = await uid();
  if (!sb || !id) return;
  await sb.from('posts').insert({
    user_id: id,
    hand_label: p.handLabel,
    note: p.note,
    photo_url: p.photoUrl,
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
