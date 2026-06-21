'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Comment, FeedPost, GroupMember, Group, Profile } from '../lib/social';
import { YOU_ID, initialOf } from '../lib/social';
import { TOTAL_HANDS } from '../lib/cardData';
import { track } from '../lib/analytics';
import ShareModal from './ShareModal';
import TileStrip from './TileStrip';
import Avatar from './Avatar';

interface Props {
  group: Group;
  members: GroupMember[];
  feed: FeedPost[];
  profile: Profile;
  /** Live stats for the local user, computed from their tracker. */
  youStats: { handsCleared: number; points: number };
  onToggleLike: (id: string, liked: boolean) => void;
  onAddComment: (id: string, text: string) => void;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

export default function GroupTab({
  group,
  members,
  feed,
  profile,
  youStats,
  onToggleLike,
  onAddComment,
}: Props) {
  // Track a feed view once per mount (core-loop metric).
  useEffect(() => {
    void track('feed_viewed', { posts: feed.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [copied, setCopied] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Merge live "you" identity + stats into the leaderboard, then rank.
  const ranked = useMemo(() => {
    const withYou = members.map((m) =>
      m.id === YOU_ID
        ? {
            ...m,
            name: profile.name,
            avatar: profile.avatar,
            handsCleared: youStats.handsCleared,
            points: youStats.points,
          }
        : m,
    );
    return withYou.sort((a, b) => b.handsCleared - a.handsCleared || b.points - a.points);
  }, [members, profile, youStats]);

  function copyCode() {
    navigator.clipboard?.writeText(group.inviteCode).then(
      () => {
        setCopied(true);
        void track('invite_code_copied');
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="screen">
      <header className="app-header">
        <h1>{group.name}</h1>
        <p className="sub">Your table’s race to clear all {TOTAL_HANDS} hands.</p>
        <TileStrip count={7} />
      </header>

      {/* Invite */}
      <div className="card" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div className="tag">Invite code</div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.04em' }}>{group.inviteCode}</div>
        </div>
        <button className="btn ghost" style={{ width: 'auto', padding: '10px 14px' }} onClick={copyCode}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          className="btn green"
          style={{ width: 'auto', padding: '10px 16px' }}
          onClick={() => setInviteOpen(true)}
        >
          ↗ Invite
        </button>
      </div>

      {inviteOpen && (
        <ShareModal
          payload={{
            title: 'Invite Your Crew 👯',
            text: `Join my mahjong table “${group.name}” and let's race to clear all 70 hands! Invite code: ${group.inviteCode}`,
            url: typeof window !== 'undefined' ? window.location.origin : '',
          }}
          onClose={() => setInviteOpen(false)}
        />
      )}

      {/* Leaderboard */}
      <div className="cat-head">
        <span className="pill" style={{ background: '#FFF1D9', color: '#E59A2B' }}>
          🏅 Leaderboard
        </span>
        <span className="count">{ranked.length} players</span>
      </div>

      <div className="card" style={{ padding: 8 }}>
        {ranked.map((m, i) => {
          const pct = Math.round((m.handsCleared / TOTAL_HANDS) * 100);
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 8px',
                borderRadius: 14,
                background: m.id === YOU_ID ? 'var(--tint)' : 'transparent',
              }}
            >
              <div style={{ width: 26, textAlign: 'center', fontWeight: 900, fontSize: 16 }}>
                {medals[i] ?? i + 1}
              </div>
              <Avatar avatar={m.avatar} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>
                  {m.name}
                  {m.id === YOU_ID && <span style={{ color: 'var(--muted)', fontWeight: 700 }}> · you</span>}
                </div>
                <div className="progress" style={{ marginTop: 6, height: 7 }}>
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>
                  {m.handsCleared}
                  <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 800 }}>/{TOTAL_HANDS}</span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 800 }}>{m.points} pts</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feed */}
      <div className="cat-head">
        <span className="pill" style={{ background: '#D5F1E9', color: '#23B196' }}>
          📣 The Feed
        </span>
        <span className="count">{feed.length} mahjs</span>
      </div>

      {feed.length === 0 ? (
        <div className="empty">
          <div className="big">🀄🀅🀆</div>
          No mahjs called yet. Be the first to call “Mahjong!”
        </div>
      ) : (
        feed.map((p) => (
          <FeedCard
            key={p.id}
            post={p}
            profile={profile}
            onToggleLike={onToggleLike}
            onAddComment={onAddComment}
          />
        ))
      )}

      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, fontWeight: 700, marginTop: 24 }}>
        Demo table — group-mates are simulated on-device. Real shared tables arrive with accounts (v2).
      </p>
    </div>
  );
}

function FeedCard({
  post,
  profile,
  onToggleLike,
  onAddComment,
}: {
  post: FeedPost;
  profile: Profile;
  onToggleLike: (id: string, liked: boolean) => void;
  onAddComment: (id: string, text: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!post.photo) return;
    const u = URL.createObjectURL(post.photo);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [post.photo]);

  function submitComment() {
    const text = draft.trim();
    if (!text) return;
    onAddComment(post.id, text);
    setDraft('');
    setShowComments(true);
  }

  return (
    <div className="win">
      {url && <img className="photo" src={url} alt="Mahj photo" />}
      <div className="body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar avatar={post.avatar} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{post.memberName}</div>
            <div className="when">{timeAgo(post.createdAt)}</div>
          </div>
          <span className="mahj-tag">🀄 MAHJ</span>
        </div>

        {post.handLabel && (
          <p className="note" style={{ fontWeight: 800, marginTop: 10, letterSpacing: '0.02em' }}>
            {post.handLabel}
          </p>
        )}
        {post.note && <p className="note">{post.note}</p>}

        {/* Like + comment bar */}
        <div className="social-bar">
          <button
            className="social-btn"
            data-on={post.likedByMe}
            onClick={() => onToggleLike(post.id, !post.likedByMe)}
          >
            <span className="ic">{post.likedByMe ? '❤️' : '🤍'}</span>
            {post.likes > 0 ? post.likes : ''} {post.likes === 1 ? 'Like' : 'Likes'}
          </button>
          <button className="social-btn" onClick={() => setShowComments((v) => !v)}>
            <span className="ic">💬</span>
            {post.comments.length > 0 ? post.comments.length : ''}{' '}
            {post.comments.length === 1 ? 'Comment' : 'Comments'}
          </button>
        </div>

        {showComments && (
          <div className="comments">
            {post.comments.map((c: Comment) => (
              <div className="comment" key={c.id}>
                <Avatar avatar={c.avatar} size={28} />
                <div className="bubble">
                  <span className="cauthor">{c.author}</span>
                  {c.text}
                </div>
              </div>
            ))}
            <div className="comment-compose">
              <Avatar avatar={profile.avatar} size={28} />
              <input
                className="field"
                style={{ padding: '9px 12px', borderRadius: 999 }}
                placeholder="Add a comment…"
                value={draft}
                maxLength={140}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitComment();
                }}
              />
              <button className="post-btn" onClick={submitComment} disabled={!draft.trim()}>
                Post
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
