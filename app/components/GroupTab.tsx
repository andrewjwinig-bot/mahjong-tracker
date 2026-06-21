'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Comment, FeedPost, GroupMember, Profile, TileAvatar } from '../lib/social';
import { YOU_ID, initialOf } from '../lib/social';
import { TOTAL_HANDS } from '../lib/cardData';
import { track } from '../lib/analytics';
import ShareModal from './ShareModal';
import TileStrip from './TileStrip';
import Avatar from './Avatar';
import Tile from './Tile';

interface Props {
  members: GroupMember[];
  feed: FeedPost[];
  profile: Profile;
  /** Live stats for the local user, computed from their tracker. */
  youStats: { handsCleared: number; points: number };
  onToggleLike: (id: string, liked: boolean) => void;
  onAddComment: (id: string, text: string) => void;
  onAddFriend: (name: string, avatar: TileAvatar) => void;
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
  members,
  feed,
  profile,
  youStats,
  onToggleLike,
  onAddComment,
  onAddFriend,
}: Props) {
  // Track a feed view once per mount (core-loop metric).
  useEffect(() => {
    void track('feed_viewed', { posts: feed.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

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

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="screen">
      <header className="app-header">
        <h1>The Feed</h1>
        <p className="sub">See what your whole crew is calling. 🀄</p>
        <TileStrip count={7} />
      </header>

      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn" onClick={() => setAddOpen(true)}>
          ＋ Add Friend
        </button>
        <button className="btn green" onClick={() => setInviteOpen(true)}>
          ↗ Invite
        </button>
      </div>

      {addOpen && (
        <AddFriendSheet
          onAdd={(name, avatar) => {
            onAddFriend(name, avatar);
            setAddOpen(false);
          }}
          onClose={() => setAddOpen(false)}
        />
      )}

      {inviteOpen && (
        <ShareModal
          payload={{
            title: 'Invite Your Crew 👯',
            text: `Come track your mahjong wins with me on Mahjong Tracker — let's race to clear all 70 hands! 🀄`,
            url: typeof window !== 'undefined' ? window.location.origin : '',
          }}
          onClose={() => setInviteOpen(false)}
        />
      )}

      {/* Leaderboard */}
      <div className="cat-head" style={{ marginTop: 22 }}>
        <span className="pill" style={{ background: '#FFF1D9', color: '#E59A2B' }}>
          🏅 Friends Leaderboard
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

/* ---- Add friend ---------------------------------------------------------- */

const FRIEND_TILES: TileAvatar[] = [
  { face: 'crack', color: '#E8455F' },
  { face: 'bam', color: '#1FA85B' },
  { face: 'dot', color: '#2F80ED' },
  { face: 'flower', color: '#E8455F' },
  { face: 'dragon', char: '發', color: '#1FA85B' },
  { face: 'joker', color: '#7C5CE0' },
  { face: 'wind', char: '東', color: '#2C3A57' },
];

interface NavWithContacts extends Navigator {
  contacts?: { select: (props: string[], opts?: { multiple?: boolean }) => Promise<{ tel?: string[] }[]> };
}

async function inviteContacts() {
  void track('invite_contacts_opened');
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const text = `Come track mahjong with me on Mahjong Tracker — let's clear all 70 hands! 🀄 ${url}`;
  const nav = navigator as NavWithContacts;
  // Android Chrome: real contact picker → prefill an SMS invite.
  if (nav.contacts?.select) {
    try {
      const picked = await nav.contacts.select(['tel'], { multiple: true });
      const nums = picked.flatMap((c) => c.tel ?? []).join(',');
      if (nums) {
        window.location.href = `sms:${nums}?&body=${encodeURIComponent(text)}`;
        return;
      }
    } catch {
      /* cancelled / unsupported — fall through */
    }
  }
  // Everywhere else (incl. iOS): native share sheet → pick contacts there.
  if (navigator.share) {
    try {
      await navigator.share({ text, url });
      return;
    } catch {
      /* cancelled */
      return;
    }
  }
  window.location.href = `sms:?&body=${encodeURIComponent(text)}`;
}

function AddFriendSheet({
  onAdd,
  onClose,
}: {
  onAdd: (name: string, avatar: TileAvatar) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [idx, setIdx] = useState(-1); // -1 = initial-letter tile

  const avatar: TileAvatar =
    idx === -1 ? { face: 'letter', char: initialOf(name || '?'), color: '#0EAD96' } : FRIEND_TILES[idx];

  function add() {
    const n = name.trim();
    if (!n) return;
    onAdd(n, idx === -1 ? { ...avatar, char: initialOf(n) } : avatar);
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h2>Find Friends 👀</h2>
        <p className="sheet-sub">Invite your contacts, or add someone to your board.</p>

        <button className="btn" onClick={inviteContacts}>
          📇 Invite From Contacts
        </button>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 11.5,
            fontWeight: 700,
            margin: '8px 0 4px',
          }}
        >
          Finding friends who already have accounts unlocks with sign-in (coming soon).
        </p>

        <div
          style={{
            height: 1.5,
            background: 'var(--hairline)',
            margin: '14px 0 16px',
          }}
        />

        <label className="lbl">Add by name</label>
        <input
          className="field"
          value={name}
          autoFocus
          maxLength={24}
          placeholder="e.g. Aunt Carol"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />

        <label className="lbl" style={{ marginTop: 14 }}>
          Their tile
        </label>
        <div className="avatar-grid">
          <button className="avatar-opt" data-active={idx === -1} onClick={() => setIdx(-1)}>
            <Tile face="letter" char={initialOf(name || '?')} color="#0EAD96" size={42} />
          </button>
          {FRIEND_TILES.map((t, i) => (
            <button key={i} className="avatar-opt" data-active={idx === i} onClick={() => setIdx(i)}>
              <Tile face={t.face} char={t.char} color={t.color} size={42} />
            </button>
          ))}
        </div>

        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={add} disabled={!name.trim()}>
            Add Friend
          </button>
        </div>
      </div>
    </div>
  );
}
