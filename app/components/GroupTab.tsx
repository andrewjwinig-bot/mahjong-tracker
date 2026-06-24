'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Comment, FeedKind, FeedPost, GroupMember, Profile, TileAvatar } from '../lib/social';
import { YOU_ID, initialOf } from '../lib/social';

// How each feed event renders its badge + milestone emblem.
const KIND_BADGE: Record<FeedKind, { label: string; color: string; emoji: string }> = {
  mahj: { label: 'MAHJ', color: 'var(--brand)', emoji: '🀄' },
  game_won: { label: 'GAME WON', color: '#C9871A', emoji: '🏆' },
  section_cleared: { label: 'SECTION', color: '#10B39A', emoji: '✅' },
  card_cleared: { label: 'FULL CARD', color: '#6A3FC0', emoji: '👑' },
  challenge_done: { label: 'CHALLENGE', color: '#F5A524', emoji: '⭐' },
  joined: { label: 'JOINED', color: '#2E86D4', emoji: '➕' },
};
import { SAMPLE_CARD, TOTAL_HANDS } from '../lib/cardData';
import { colorNotation } from '../lib/theme';
import { track } from '../lib/analytics';
import { loadTables, nextGame, type NextGame } from '../lib/tables';
import ShareModal from './ShareModal';
import Avatar from './Avatar';
import Tile from './Tile';
import { IconShare, IconPlus, IconHeart, IconComment, IconMedal, IconFeed, IconContacts, IconUsers, IconFlame } from './uiIcons';
import ProUpsell from './ProUpsell';

interface Props {
  members: GroupMember[];
  feed: FeedPost[];
  profile: Profile;
  /** Live stats for the local user, computed from their tracker. */
  youStats: { handsCleared: number; points: number };
  /** The local user's real per-hand win counts (for your own detail view). */
  handCounts: Record<string, number>;
  streak: number;
  onToggleLike: (id: string, liked: boolean) => void;
  onAddComment: (id: string, text: string) => void;
  onAddFriend: (name: string, avatar: TileAvatar) => void;
  onScore: () => void;
  onOpenTables: (tableId: string) => void;
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

// "Today" / "Tomorrow" / "Wed Jun 25" + optional time, for the next-game card.
function gameWhen(date: string, time?: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((dt.getTime() - today.getTime()) / 86400000);
  const day =
    days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  if (!time) return day;
  const [hh, mm] = time.split(':').map(Number);
  const t = new Date(y, m - 1, d, hh, mm).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${t}`;
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
  streak,
  onToggleLike,
  onAddComment,
  onAddFriend,
  onScore,
  onOpenTables,
}: Props) {
  const [nextG, setNextG] = useState<NextGame | null>(null);
  useEffect(() => {
    let alive = true;
    void loadTables().then((t) => alive && setNextG(nextGame(t)));
    return () => {
      alive = false;
    };
  }, []);
  const [detail, setDetail] = useState<GroupMember | null>(null);
  const [lbMetric, setLbMetric] = useState<'rows' | 'points'>('rows');
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
    return withYou.sort((a, b) =>
      lbMetric === 'points'
        ? b.points - a.points || b.handsCleared - a.handsCleared
        : b.handsCleared - a.handsCleared || b.points - a.points,
    );
  }, [members, profile, youStats, lbMetric]);

  const maxPoints = Math.max(1, ...ranked.map((m) => m.points));

  // Podium tint for the dot-tile ranks: gold / silver / bronze, then standard
  // dot-blue for everyone below the medals.
  const rankColor = (i: number) => ['#E0A12B', '#8FA1B6', '#C77B43'][i] ?? '#2F80ED';

  return (
    <div className="screen">
      <header className="app-header">
        <h1>The Feed</h1>
        <p className="sub">
          {profile.name ? `Hi ${profile.name.split(' ')[0]} — ` : ''}see what your whole crew is calling.
        </p>
      </header>

      {nextG && (
        <button className="next-game" onClick={() => onOpenTables(nextG.tableId)}>
          <Tile face={nextG.icon.face} char={nextG.icon.char} color={nextG.icon.color} size={40} />
          <span className="ng-body">
            <span className="ng-label">⏰ NEXT GAME</span>
            <span className="ng-when">{gameWhen(nextG.date, nextG.time)}</span>
            <span className="ng-meta">
              {nextG.tableName} · {nextG.votes} in
            </span>
          </span>
          <span className="ng-chev">›</span>
        </button>
      )}

      {streak > 1 && (
        <div className="feed-streak">
          <span className="fs-flame"><IconFlame size={16} /></span>
          <span>
            You’re on a <strong>{streak}-day streak</strong> — keep it going!
          </span>
        </div>
      )}

      <button className="score-cta" onClick={onScore}>
        <span className="mahj-hero-shine" aria-hidden />
        ⊕ Score a Game
      </button>

      <div className="feed-actions">
        <button className="feed-btn primary" onClick={() => setAddOpen(true)}>
          <IconPlus size={16} /> ADD FRIEND
        </button>
        <button className="feed-btn pine" onClick={() => setInviteOpen(true)}>
          <IconShare size={16} /> INVITE
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
      <div className="lb-card">
        <div className="lb-head">
          <span className="lb-title">
            <IconMedal size={14} /> FRIENDS LEADERBOARD
          </span>
          <span className="lb-count">{ranked.length} PLAYERS</span>
        </div>

        <div className="segmented lb-seg">
          <button data-active={lbMetric === 'rows'} onClick={() => setLbMetric('rows')}>
            Rows cleared
          </button>
          <button data-active={lbMetric === 'points'} onClick={() => setLbMetric('points')}>
            Total points
          </button>
        </div>

        {ranked.map((m, i) => {
          const pct =
            lbMetric === 'points'
              ? Math.round((m.points / maxPoints) * 100)
              : Math.round((m.handsCleared / TOTAL_HANDS) * 100);
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
              <div style={{ width: 34, display: 'grid', placeItems: 'center' }} aria-label={`Rank ${i + 1}`}>
                {i < 9 ? (
                  <Tile face="dot" count={i + 1} color={rankColor(i)} size={30} />
                ) : (
                  <span style={{ fontWeight: 900, fontSize: 16 }}>{i + 1}</span>
                )}
              </div>
              <Avatar avatar={m.avatar} size={36} />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>
                  {m.name}
                  {m.id === YOU_ID && <span style={{ color: 'var(--muted)', fontWeight: 700 }}> · you</span>}
                </div>
                <div className="progress" style={{ marginTop: 6, height: 7 }}>
                  <span style={{ width: `${pct}%`, background: m.avatar.color }} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>
                  {lbMetric === 'points' ? (
                    <>
                      {m.points}
                      <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 800 }}> pts</span>
                    </>
                  ) : (
                    <>
                      {m.handsCleared}
                      <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 800 }}>/{TOTAL_HANDS}</span>
                    </>
                  )}
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
          rank={Math.max(1, ranked.findIndex((m) => m.id === detail.id) + 1)}
          onClose={() => setDetail(null)}
        />
      )}

      {/* Feed */}
      <div className="feed-label">
        <IconFeed size={13} /> THE FEED
      </div>

      {feed.length === 0 ? (
        <div className="feed-empty">
          <div className="fe-tiles" aria-hidden>
            <span className="fe-tile">🀄</span>
            <span className="fe-tile">🀅</span>
            <span className="fe-tile">🀆</span>
          </div>
          <div className="fe-title">No mahjs called yet</div>
          <div className="fe-sub">
            Be the first — call Mahj on your Card and it’ll land right here for your crew to see.
          </div>
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

      <div style={{ marginTop: 22 }}>
        <ProUpsell />
      </div>

      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, fontWeight: 700, marginTop: 22 }}>
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

  const kind = post.kind ?? 'mahj';
  const badge = KIND_BADGE[kind];

  return (
    <div className="post">
      {url && <img className="photo" src={url} alt="Mahj photo" style={{ marginBottom: 11 }} />}
      <div className="post-head">
        <Avatar avatar={post.avatar} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="post-name">{post.memberName}</div>
          <div className="post-time">{timeAgo(post.createdAt).toUpperCase()}</div>
        </div>
        <span className="post-badge" style={{ background: badge.color }}>
          {badge.label}
        </span>
      </div>

      {kind === 'mahj'
        ? post.handLabel && (
            <div className="post-note">
              {colorNotation(post.handLabel).map((g, i, arr) => (
                <span key={i} className={g.cls}>
                  {g.text}
                  {i < arr.length - 1 ? ' ' : ''}
                </span>
              ))}
            </div>
          )
        : post.title && (
            <div className="post-milestone" style={{ borderColor: badge.color }}>
              <span className="pm-emoji" aria-hidden>
                {badge.emoji}
              </span>
              <span className="pm-title">{post.title}</span>
            </div>
          )}
      {post.note && <p className="post-cap">{post.note}</p>}

      {/* Like + comment bar */}
      <div className="post-actions">
        <button
          className="post-act"
          data-on={post.likedByMe}
          onClick={() => onToggleLike(post.id, !post.likedByMe)}
        >
          <IconHeart size={16} fill={post.likedByMe} />
          {post.likes > 0 ? ` ${post.likes}` : ''} {post.likes === 1 ? 'Like' : 'Likes'}
        </button>
        <button className="post-act" onClick={() => setShowComments((v) => !v)}>
          <IconComment size={16} />
          {post.comments.length > 0 ? ` ${post.comments.length}` : ''}{' '}
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
  );
}

/* ---- Member detail (which hands they've cleared) ------------------------- */

function MemberDetail({
  member,
  completed,
  rank,
  onClose,
}: {
  member: GroupMember;
  completed: Set<string>;
  rank: number;
  onClose: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const cleared = completed.size;
  const pct = Math.round((cleared / TOTAL_HANDS) * 100);
  const handle = member.name.toLowerCase().replace(/\s+/g, '');
  // A couple of "recent mahjs" drawn from their cleared hands.
  const recent = SAMPLE_CARD.hands.filter((h) => completed.has(h.id)).slice(0, 2);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet member-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Cinnabar header band */}
        <div className="md-band">
          <span className="md-stripe" aria-hidden />
          <div className="grab light" />
          <div className="md-band-row">
            <span className="md-avatar">
              <Avatar avatar={member.avatar} size={46} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="md-name">{member.name}</div>
              <div className="md-handle">
                @{handle}
                {!member.isYou ? ' · FRIEND' : ' · YOU'}
              </div>
            </div>
            <div className="md-rank">
              <div className="md-rank-n">#{rank}</div>
              <div className="md-rank-l">RANK</div>
            </div>
          </div>
        </div>

        <div className="md-body">
          {/* Stat tiles */}
          <div className="md-stats">
            <div className="md-stat">
              <div className="md-num">
                {cleared}
                <span style={{ fontSize: 13, color: 'var(--green)' }}>/{TOTAL_HANDS}</span>
              </div>
              <div className="md-lab" style={{ color: 'var(--green)' }}>CLEARED</div>
            </div>
            <div className="md-stat">
              <div className="md-num">{cleared}</div>
              <div className="md-lab" style={{ color: 'var(--brand)' }}>MAHJS</div>
            </div>
            <div className="md-stat">
              <div className="md-num">{member.points}</div>
              <div className="md-lab" style={{ color: '#C9871A' }}>POINTS</div>
            </div>
          </div>

          {/* Collection progress */}
          <div className="md-prog-head">
            <span>COLLECTION PROGRESS</span>
            <span style={{ color: 'var(--brand)' }}>{pct}%</span>
          </div>
          <div className="progress" style={{ marginTop: 0, marginBottom: 22 }}>
            <span style={{ width: `${pct}%` }} />
          </div>

          {/* Recent mahjs */}
          {recent.length > 0 && (
            <>
              <div className="set-label">RECENT MAHJS</div>
              {recent.map((h) => (
                <div key={h.id} className="md-recent">
                  <div className="md-recent-note">
                    {colorNotation(h.notation).map((g, i, arr) => (
                      <span key={i} className={g.cls}>
                        {g.text}
                        {i < arr.length - 1 ? ' ' : ''}
                      </span>
                    ))}
                  </div>
                  <span className="md-badge">+{h.points}</span>
                </div>
              ))}
            </>
          )}

          {/* Expandable full breakdown */}
          {showAll &&
            SAMPLE_CARD.categories.map((cat) => {
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

          <div className="md-foot">
            <button className="md-done" onClick={onClose}>
              DONE
            </button>
            <button className="md-viewall" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Hide hands' : '⚇ View all hands'}
            </button>
          </div>
        </div>
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
        <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <IconUsers size={20} /> Find Friends
        </h2>
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
