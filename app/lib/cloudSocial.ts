// Cloud-backed feed: maps cloud posts into the app's FeedPost shape and mirrors
// the local user's feed actions (post / like / comment) and moderation
// (report / block) up to Supabase. Every function no-ops unless cloud is on AND
// a user is signed in, so the UI can call them unconditionally; the local feed
// stays the source of truth for optimistic updates.

import { cloudSignedIn } from './cloudSync';
import { uploadPhoto } from './cloudStorage';
import {
  cloudListFeed,
  cloudCreatePost,
  cloudToggleLike,
  cloudAddComment,
  cloudBlockUser,
  cloudReportPost,
  type CloudPost,
} from './cloudFeed';
import type { FeedPost } from './social';

function toFeedPost(p: CloudPost): FeedPost {
  return {
    id: p.id,
    memberId: p.authorId,
    memberName: p.memberName,
    avatar: p.avatar,
    handLabel: p.handLabel,
    note: p.note,
    photo: null,
    photoUrl: p.photoUrl,
    createdAt: p.createdAt,
    likes: p.likes,
    likedByMe: p.likedByMe,
    comments: p.comments.map((c) => ({
      id: c.id,
      author: c.author,
      avatar: c.avatar,
      text: c.text,
      createdAt: c.createdAt,
    })),
    kind: p.kind,
    title: p.title,
    eyebrow: p.eyebrow,
    progress: p.progress,
    place: p.place,
  };
}

/** Real feed from the cloud, or null when cloud is off / signed out. */
export async function loadCloudFeed(): Promise<FeedPost[] | null> {
  if (!(await cloudSignedIn())) return null;
  const posts = await cloudListFeed();
  return posts.map(toFeedPost);
}

export function mirrorCreatePost(post: FeedPost): void {
  void cloudSignedIn().then(async (ok) => {
    if (!ok) return;
    let photoUrl = post.photoUrl ?? null;
    if (!photoUrl && post.photo) photoUrl = await uploadPhoto(post.photo, 'feed');
    await cloudCreatePost({
      id: post.id,
      handLabel: post.handLabel,
      note: post.note,
      photoUrl,
      kind: post.kind,
      title: post.title,
      eyebrow: post.eyebrow,
      progress: post.progress,
      place: post.place,
    });
  });
}

export function mirrorToggleLike(postId: string, liked: boolean): void {
  void cloudSignedIn().then((ok) => {
    if (ok) void cloudToggleLike(postId, liked);
  });
}

export function mirrorAddComment(postId: string, text: string): void {
  void cloudSignedIn().then((ok) => {
    if (ok) void cloudAddComment(postId, text);
  });
}

export function reportPost(postId: string, authorId: string): void {
  void cloudSignedIn().then((ok) => {
    if (ok) void cloudReportPost(postId, authorId);
  });
}

export function blockUser(userId: string): void {
  void cloudSignedIn().then((ok) => {
    if (ok) void cloudBlockUser(userId);
  });
}
