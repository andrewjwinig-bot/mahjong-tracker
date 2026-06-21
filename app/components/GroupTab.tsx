'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Comment, FeedPost, GroupMember, Profile, TileAvatar } from '../lib/social';
import { YOU_ID, initialOf } from '../lib/social';
import { SAMPLE_CARD, TOTAL_HANDS } from '../lib/cardData';
import { colorNotation } from '../lib/theme';
import { track } from '../lib/analytics';
import ShareModal from './ShareModal';
import TileStrip from './TileStrip';
import Avatar from './Avatar';
import Tile from './Tile';
import { IconShare, IconPlus, IconHeart, IconComment, IconMedal, IconFeed, IconContacts } from './uiIcons';

interface Props {
  members: GroupMember[];
  feed: FeedPost[];
  profile: Profile;
  /** Live stats for the local user, computed from their tracker. */
  youStats: { handsCleared: number; points: number };
  /** The local user's real per-hand win counts (for your own detail view). */
  handCounts: Record<string, number>;
  onToggleLike: (id: string, liked: boolean) => void;
  onAddComment: (id: string, text: string) => void;
  onAddFriend: (name: string, avatar: TileAvatar) => void;
}

/** Which hand ids a member has cleared. Real for you; deterministic for demo
 *  friends so their detail view is stable + spread across categories. */
function completedHandIds(
  member: GroupMember,
  handCounts: Record<string, number>,
): Set<string> {
  if (member.isYou) {
    return new Set(SAMPLE_CARD.hands.filter((h) => (handCounts[h.id] ?? 0) > 0).map((h) => h.id));
  }
  let seed = 2166136261;
  for (const c of member.id) seed = (Math.imul(seed ^ c.charCodeAt(0), 16777619) >>> 0);
  const ids = SAMPLE_CARD.hands.map((h) => h.id);
  for (let i = ids.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return new Set(ids.slice(0, Math.min(member.handsCleared, ids.length)));
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
  handCounts,
  onToggleLike,
  onAddComment,
  onAddFriend,
}: Props) {
  const [detail, setDetail] = useState<GroupMember | null>(null);
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
        <button
          className="btn"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          onClick={() => setAddOpen(true)}
        >
          <IconPlus size={17} /> Add Friend
        </button>
        <button
          className="btn green"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          onClick={() => setInviteOpen(true)}
        >
          <IconShare size={17} /> Invite
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
        <span
          className="pill"
          style={{ background: '#FFF1D9', color: '#E59A2B', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <IconMedal size={15} /> Friends Leaderboard
        </span>
        <span className="count">{ranked.length} players</span>
      </div>

      <div className="card" style={{ padding: 8 }}>
        {ranked.map((m, i) => {
          const pct = Math.round((m.handsCleared / TOTAL_HANDS) * 100);
          return (
            <button
              key={m.id}
              className="lb-row"
              onClick={() => {
                setDetail(m);
                void track('leaderboard_member_opened');
              }}
              style={{ background: m.id === YOU_ID ? 'var(--tint)' : 'transparent' }}
            >
              <div style={{ width: 26, textAlign: 'center', fontWeight: 900, fontSize: 16 }}>
                {medals[i] ?? i + 1}
              </div>
              <Avatar avatar={m.avatar} size={36} />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
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
                <div style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 800 }}>tap to view</div>
              </div>
            </button>
          );
        })}
      </div>

      {detail && (
        <MemberDetail
          member={detail}
          completed={completedHandIds(detail, handCounts)}
          onClose={() => setDetail(null)}
        />
      )}

      {/* Feed */}
      <div className="cat-head">
        <span
          className="pill"
          style={{ background: '#D5F1E9', color: '#23B196', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <IconFeed size={15} /> The Feed
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
            <span className="ic"><IconHeart size={18} fill={post.likedByMe} /></span>
            {post.likes > 0 ? post.likes : ''} {post.likes === 1 ? 'Like' : 'Likes'}
          </button>
          <button className="social-btn" onClick={() => setShowComments((v) => !v)}>
            <span className="ic"><IconComment size={18} /></span>
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

/* ---- Member detail (which hands they've cleared) ------------------------- */

function MemberDetail({
  member,
  completed,
  onClose,
}: {
  member: GroupMember;
  completed: Set<string>;
  onClose: () => void;
}) {
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <Avatar avatar={member.avatar} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 20, textTransform: 'uppercase', color: 'var(--brand)' }}>
              {member.name}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
              {completed.size}/{TOTAL_HANDS} cleared · {member.points} pts
            </div>
          </div>
        </div>

        {SAMPLE_CARD.categories.map((cat) => {
          const hands = SAMPLE_CARD.hands.filter((h) => h.category === cat);
          const done = hands.filter((h) => completed.has(h.id)).length;
          return (
            <section key={cat}>
              <div className="cat-head" style={{ margin: '16px 2px 8px' }}>
                <span className="pill">{cat}</span>
                <span className="count">
                  {done}/{hands.length}
                </span>
              </div>
              {hands.map((h) => {
                const got = completed.has(h.id);
                return (
                  <div key={h.id} className={`mini-hand${got ? ' got' : ''}`}>
                    <span className="mini-check" data-on={got}>
                      {got ? '✓' : ''}
                    </span>
                    <span className="mini-note">
                      {colorNotation(h.notation).map((g, i, arr) => (
                        <span key={i} className={g.cls}>
                          {g.text}
                          {i < arr.length - 1 ? ' ' : ''}
                        </span>
                      ))}
                    </span>
                    <span className="pts">{h.concealed ? `C${h.points}` : `×${h.points}`}</span>
                  </div>
                );
              })}
            </section>
          );
        })}

        <button className="btn ghost" style={{ marginTop: 18 }} onClick={onClose}>
          Done
        </button>
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

        <button
          className="btn"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={inviteContacts}
        >
          <IconContacts size={18} /> Invite From Contacts
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
