'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Comment, FeedKind, FeedPost, GroupMember, Profile, TileAvatar } from '../lib/social';
import { YOU_ID } from '../lib/social';
import { isCloudEnabled } from '../lib/supabase';
import { cloudSearchProfiles, cloudAddFriend, type CloudFriend } from '../lib/cloudFriends';

// How each feed event renders its badge + milestone emblem.
const KIND_BADGE: Record<FeedKind, { label: string; color: string; emoji: string }> = {
  mahj: { label: 'MAHJ', color: '#15803D', emoji: '🀄' },
  game_won: { label: 'GAME WON', color: '#C9871A', emoji: '🏆' },
  section_cleared: { label: 'SECTION', color: '#10B39A', emoji: '✅' },
  card_cleared: { label: 'FULL CARD', color: '#6A3FC0', emoji: '👑' },
  challenge_done: { label: 'CHALLENGE', color: '#F5A524', emoji: '⭐' },
  joined: { label: 'JOINED', color: '#2E86D4', emoji: '➕' },
};

// The achievement-banner eyebrow per milestone kind (the big two-tone title is
// the post's own title). game_won shows a place badge instead of a progress bar.
const KIND_EYEBROW: Partial<Record<FeedKind, string>> = {
  game_won: '★ GAME NIGHT WON',
  section_cleared: 'SECTION COMPLETE',
  card_cleared: '♛ CARD CLEARED',
  challenge_done: '★ CHALLENGE COMPLETE',
  joined: '➕ JOINED THE TABLE',
};

// Faint decorative motif behind each milestone banner's title (design frame 2):
// challenge = concentric sunburst, section = stacked bars, card = crown,
// game won = scattered stars.
function BannerMotif({ kind }: { kind: FeedKind }) {
  if (kind === 'challenge_done') {
    return (
      <svg className="pb-motif" viewBox="0 0 100 100" style={{ top: -20, right: -16, width: 124, height: 124 }} aria-hidden>
        <g fill="none" stroke="#fff" strokeWidth="3">
          <circle cx="50" cy="50" r="15" />
          <circle cx="50" cy="50" r="27" />
          <circle cx="50" cy="50" r="39" />
        </g>
        <circle cx="50" cy="50" r="6" fill="#fff" />
        <g stroke="#fff" strokeWidth="3.4" strokeLinecap="round">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="50" y1="1" x2="50" y2="9" transform={`rotate(${a} 50 50)`} />
          ))}
        </g>
      </svg>
    );
  }
  if (kind === 'section_cleared') {
    return (
      <svg className="pb-motif" viewBox="0 0 150 130" preserveAspectRatio="xMaxYMid slice" style={{ inset: 0, width: '100%', height: '100%', opacity: 0.12 }} aria-hidden>
        <g fill="#fff">
          <rect x="20" y="16" width="96" height="12" rx="6" />
          <rect x="20" y="40" width="124" height="12" rx="6" />
          <rect x="20" y="64" width="82" height="12" rx="6" />
          <rect x="20" y="88" width="112" height="12" rx="6" />
          <rect x="20" y="112" width="70" height="12" rx="6" />
        </g>
      </svg>
    );
  }
  if (kind === 'card_cleared') {
    return (
      <svg className="pb-motif" viewBox="0 0 130 120" preserveAspectRatio="xMaxYMid slice" style={{ top: 0, right: -8, width: 142, height: '100%' }} aria-hidden>
        <path d="M20 88 L20 46 L44 68 L65 30 L86 68 L110 46 L110 88 Z" fill="#fff" />
        <rect x="20" y="90" width="90" height="15" rx="3" fill="#fff" />
        <circle cx="65" cy="23" r="7" fill="#fff" />
        <circle cx="20" cy="42" r="5.5" fill="#fff" />
        <circle cx="110" cy="42" r="5.5" fill="#fff" />
      </svg>
    );
  }
  if (kind === 'game_won') {
    return (
      <svg className="pb-motif" viewBox="0 0 144 130" preserveAspectRatio="xMaxYMid slice" style={{ top: 0, right: 0, width: 150, height: '100%', opacity: 0.17 }} aria-hidden>
        <text x="104" y="66" textAnchor="middle" fontSize="68" fill="#fff">★</text>
        <text x="44" y="42" textAnchor="middle" fontSize="32" fill="#fff">★</text>
        <text x="72" y="114" textAnchor="middle" fontSize="26" fill="#fff">★</text>
        <circle cx="22" cy="80" r="4.5" fill="#fff" />
        <circle cx="132" cy="104" r="5.5" fill="#fff" />
      </svg>
    );
  }
  return null;
}
import { SAMPLE_CARD, TOTAL_HANDS } from '../lib/cardData';
import { colorNotation } from '../lib/theme';
import { track } from '../lib/analytics';
import { loadTables, nextGame, type NextGame } from '../lib/tables';
import Avatar from './Avatar';
import Tile from './Tile';
import TipCard from './TipCard';
import { useSwipeDismiss } from '../lib/useSwipeDismiss';

// A self-contained burst of ~20 mini mahjong-tile particles that rain down
// inside a banner (design frame 8: the FULL CARD post). Mirrors the prototype's
// confetti() — randomized size, sway, rotation, duration and delay.
function fireTileRain(el: HTMLElement | null) {
  if (!el) return;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const W = el.clientWidth;
  const H = el.clientHeight;
  const faces: { g?: string; c?: string; dot?: string; bam?: string }[] = [
    { g: '萬', c: '#C0392B' }, { g: '發', c: '#15803D' }, { g: '中', c: '#C0392B' },
    { g: '東', c: '#1A1410' }, { g: '花', c: '#E2568F' }, { dot: '#2E86D4' },
    { dot: '#C0392B' }, { bam: '#15803D' }, { bam: '#C0392B' },
  ];
  const layer = document.createElement('div');
  layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:4;border-radius:inherit';
  el.appendChild(layer);
  let remaining = 20;
  const done = () => { if (--remaining <= 0) layer.remove(); };
  for (let i = 0; i < 20; i++) {
    const w = 14 + Math.round(Math.random() * 8);
    const h = Math.round(w * 1.34);
    const f = faces[Math.floor(Math.random() * faces.length)];
    const t = document.createElement('div');
    const x = Math.random() * (W - w);
    t.style.cssText = `position:absolute;left:${x.toFixed(0)}px;top:${-h - 8}px;width:${w}px;height:${h}px;border-radius:3px;background:linear-gradient(155deg,#FFFEFB,#F0E9DA);border:1.5px solid rgba(20,22,42,0.20);box-shadow:0 2px 5px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center`;
    if (f.g) t.innerHTML = `<span style="font-family:serif;font-weight:700;font-size:${Math.round(h * 0.56)}px;line-height:1;color:${f.c}">${f.g}</span>`;
    else if (f.dot) { const s = Math.round(w * 0.6); t.innerHTML = `<svg width="${s}" height="${s}" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="none" stroke="${f.dot}" stroke-width="2.4"/><circle cx="7" cy="7" r="1.8" fill="${f.dot}"/></svg>`; }
    else t.innerHTML = `<svg width="${Math.round(w * 0.55)}" height="${Math.round(h * 0.55)}" viewBox="0 0 12 18"><rect x="2" y="2" width="3" height="14" rx="1.5" fill="${f.bam}"/><rect x="7" y="2" width="3" height="14" rx="1.5" fill="${f.bam}"/></svg>`;
    layer.appendChild(t);
    const sway = (Math.random() - 0.5) * 40;
    const rot = (Math.random() - 0.5) * 620;
    const dur = 1500 + Math.random() * 1100;
    const delay = Math.random() * 500;
    t.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${(sway * 0.4).toFixed(0)}px,${Math.round(H * 0.3)}px) rotate(${(rot * 0.3).toFixed(0)}deg)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${sway.toFixed(0)}px,${H + h + 16}px) rotate(${rot.toFixed(0)}deg)`, opacity: 1, offset: 0.85 },
        { transform: `translate(${sway.toFixed(0)}px,${H + h + 30}px) rotate(${rot.toFixed(0)}deg)`, opacity: 0 },
      ],
      { duration: dur, delay, easing: 'cubic-bezier(.35,.45,.5,1)' },
    ).onfinish = () => { t.remove(); done(); };
  }
}

// GAME WON gets its own celebration: a burst of gold stars (matching the
// banner's star motif) that rain + twinkle — distinct from the tile-confetti.
function fireStarBurst(el: HTMLElement | null) {
  if (!el) return;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const W = el.clientWidth;
  const H = el.clientHeight;
  const colors = ['#F5A524', '#FFD874', '#FFE08A', '#FFFFFF'];
  const layer = document.createElement('div');
  layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:4;border-radius:inherit';
  el.appendChild(layer);
  let remaining = 16;
  const done = () => { if (--remaining <= 0) layer.remove(); };
  for (let i = 0; i < 16; i++) {
    const size = 14 + Math.round(Math.random() * 14);
    const star = document.createElement('div');
    const x = Math.random() * (W - size);
    const c = colors[Math.floor(Math.random() * colors.length)];
    star.textContent = '★';
    star.style.cssText = `position:absolute;left:${x.toFixed(0)}px;top:${-size - 8}px;font-size:${size}px;line-height:1;color:${c};text-shadow:0 1px 3px rgba(0,0,0,.25)`;
    layer.appendChild(star);
    const sway = (Math.random() - 0.5) * 52;
    const rot = (Math.random() - 0.5) * 540;
    const dur = 1400 + Math.random() * 1100;
    const delay = Math.random() * 450;
    star.animate(
      [
        { transform: 'translate(0,0) rotate(0deg) scale(.5)', opacity: 0 },
        { transform: `translate(${(sway * 0.4).toFixed(0)}px,${Math.round(H * 0.3)}px) rotate(${(rot * 0.3).toFixed(0)}deg) scale(1)`, opacity: 1, offset: 0.18 },
        { transform: `translate(${sway.toFixed(0)}px,${H + size + 16}px) rotate(${rot.toFixed(0)}deg) scale(1)`, opacity: 1, offset: 0.85 },
        { transform: `translate(${sway.toFixed(0)}px,${H + size + 30}px) rotate(${rot.toFixed(0)}deg) scale(.85)`, opacity: 0 },
      ],
      { duration: dur, delay, easing: 'cubic-bezier(.35,.5,.5,1)' },
    ).onfinish = () => { star.remove(); done(); };
  }
}

// Fire the right celebration for a milestone banner: the "clear" milestones
// rain tile-confetti; GAME WON gets the gold star-burst.
function fireBanner(el: HTMLElement | null, kind: FeedKind) {
  if (kind === 'game_won') fireStarBurst(el);
  else fireTileRain(el);
}
import PageTitle from './PageTitle';
import type { Experience } from '../lib/account';
import { IconHeart, IconComment, IconMedal, IconFeed, IconContacts, IconUsers, IconFlame } from './uiIcons';
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
  experience: Experience;
  onToggleLike: (id: string, liked: boolean) => void;
  onAddComment: (id: string, text: string) => void;
  onAddFriend: (name: string, avatar: TileAvatar) => void;
  /** Moderation (cloud only): flag a post / block its author. */
  onReport?: (id: string, authorId: string) => void;
  onBlock?: (authorId: string) => void;
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

const STREAK_DISMISS_KEY = 'mahj.streakDismissed';
const streakDayKey = () => new Date().toDateString();

export default function GroupTab({
  members,
  feed,
  profile,
  youStats,
  handCounts,
  streak,
  experience,
  onToggleLike,
  onAddComment,
  onAddFriend,
  onReport,
  onBlock,
  onScore,
  onOpenTables,
}: Props) {
  const cloud = isCloudEnabled();
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

  const [addOpen, setAddOpen] = useState(false);

  // Streak banner: dismissible for the day, like the Tip — it returns tomorrow.
  const [streakHidden, setStreakHidden] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(STREAK_DISMISS_KEY) === streakDayKey()) setStreakHidden(true);
    } catch {
      /* ignore */
    }
  }, []);
  function dismissStreak() {
    try {
      localStorage.setItem(STREAK_DISMISS_KEY, streakDayKey());
    } catch {
      /* ignore */
    }
    setStreakHidden(true);
  }

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


  return (
    <div className="screen">
      <header className="app-header">
        <PageTitle kicker={`${(profile.name.trim().split(/\s+/)[0] || 'Your').toUpperCase()}’S`} word="Feed" />
        <p className="sub">See what your table’s been up to.</p>
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

      {streak > 1 && !streakHidden && (
        <div className="feed-streak">
          <span className="fs-flame"><IconFlame size={16} /></span>
          <span style={{ flex: 1 }}>
            You’re on a <strong>{streak}-day streak</strong> — keep it going!
          </span>
          <button className="fs-dismiss" onClick={dismissStreak} aria-label="Dismiss streak">
            ×
          </button>
        </div>
      )}

      <button className="score-cta" style={{ marginBottom: 22 }} onClick={onScore}>
        <span className="mahj-hero-shine" aria-hidden />
        <span className="score-cta-tile" style={{ color: '#C0392B', transform: 'rotate(-7deg)' }} aria-hidden>
          萬
        </span>
        <span className="score-cta-label">SCORE A GAME</span>
        <span className="score-cta-tile" style={{ color: '#15803D', transform: 'rotate(7deg)' }} aria-hidden>
          發
        </span>
      </button>

      {addOpen && (
        <AddFriendSheet
          onAdd={(name, avatar) => {
            onAddFriend(name, avatar);
            setAddOpen(false);
          }}
          onClose={() => setAddOpen(false)}
        />
      )}

      {/* Leaderboard */}
      <div className="lb-card">
        <div className="lb-head">
          <span className="lb-title">
            <IconMedal size={14} /> FRIENDS LEADERBOARD
          </span>
          <span className="lb-head-right">
            <span className="lb-count">{ranked.length} PLAYERS</span>
            <button className="lb-add" onClick={() => setAddOpen(true)}>
              + Add
            </button>
          </span>
        </div>

        <div className="segmented lb-seg">
          <button data-active={lbMetric === 'rows'} onClick={() => setLbMetric('rows')}>
            Hands cleared
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
              style={{ background: m.id === YOU_ID ? '#F4F6FA' : 'transparent' }}
            >
              <Avatar avatar={m.avatar} size={32} />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.name}
                    {m.id === YOU_ID && (
                      <span style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', fontSize: 9, color: 'var(--brand)' }}> · YOU</span>
                    )}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', fontSize: 11, flex: 'none' }}>
                    {lbMetric === 'points' ? (
                      <>
                        {m.points}
                        <span style={{ color: 'var(--muted)' }}> pts</span>
                      </>
                    ) : (
                      <>
                        {m.handsCleared}
                        <span style={{ color: 'var(--muted)' }}>/{TOTAL_HANDS}</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="progress" style={{ marginTop: 0, height: 11 }}>
                  <span
                    style={{ width: `${pct}%`, background: m.avatar.color, animationDelay: `${0.35 + i * 0.1}s` }}
                  />
                </div>
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

      <div style={{ margin: '4px 0 18px' }}>
        <TipCard experience={experience} />
      </div>

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
        feed.map((p) => {
          const isMine = p.memberId === YOU_ID || p.memberName === profile.name;
          return (
            <FeedCard
              key={p.id}
              post={p}
              profile={profile}
              onToggleLike={onToggleLike}
              onAddComment={onAddComment}
              canModerate={cloud && !isMine && !!onReport}
              onReport={onReport}
              onBlock={onBlock}
            />
          );
        })
      )}

      <div style={{ marginTop: 22 }}>
        <ProUpsell />
      </div>

      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, fontWeight: 700, marginTop: 22 }}>
        {cloud
          ? 'The feed is live — posts are from real players. The leaderboard still shows demo group-mates for now.'
          : 'Demo table — group-mates are simulated on-device. Real shared tables arrive with accounts (v2).'}
      </p>
    </div>
  );
}

function FeedCard({
  post,
  profile,
  onToggleLike,
  onAddComment,
  canModerate,
  onReport,
  onBlock,
}: {
  post: FeedPost;
  profile: Profile;
  onToggleLike: (id: string, liked: boolean) => void;
  onAddComment: (id: string, text: string) => void;
  canModerate?: boolean;
  onReport?: (id: string, authorId: string) => void;
  onBlock?: (authorId: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moderated, setModerated] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const firedRef = useRef(false);

  const kind = post.kind ?? 'mahj';
  // Every rare milestone banner celebrates with tile-confetti.
  const firesConfetti =
    kind === 'card_cleared' || kind === 'section_cleared' || kind === 'challenge_done' || kind === 'game_won';

  // A milestone banner auto-fires its tile-confetti once when it scrolls
  // ≥55% into view, and re-fires on tap (design frame 8).
  useEffect(() => {
    if (!firesConfetti) return;
    const el = bannerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.55 && !firedRef.current) {
            firedRef.current = true;
            fireBanner(el, kind);
          }
        }
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [firesConfetti, kind]);

  useEffect(() => {
    // Prefer the on-device Blob; fall back to the synced cloud URL.
    if (post.photo) {
      const u = URL.createObjectURL(post.photo);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setUrl(post.photoUrl ?? null);
  }, [post.photo, post.photoUrl]);

  function submitComment() {
    const text = draft.trim();
    if (!text) return;
    onAddComment(post.id, text);
    setDraft('');
    setShowComments(true);
  }

  const badge = KIND_BADGE[kind];

  if (moderated) {
    return (
      <div
        className="post"
        style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, fontWeight: 700, padding: 16 }}
      >
        {moderated === 'reported'
          ? 'Thanks — this post was reported and hidden.'
          : `You blocked ${post.memberName}. Their posts are hidden.`}
      </div>
    );
  }

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
        {canModerate && (
          <div style={{ position: 'relative' }}>
            <button
              aria-label="Post options"
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 20,
                lineHeight: 1,
                padding: '0 4px',
                color: 'var(--muted)',
              }}
            >
              ⋯
            </button>
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  zIndex: 20,
                  background: 'var(--card, #fff)',
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                  overflow: 'hidden',
                  minWidth: 168,
                }}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onReport?.(post.id, post.memberId);
                    setModerated('reported');
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: 'var(--ink, #1a1410)',
                  }}
                >
                  Report post
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onBlock?.(post.memberId);
                    setModerated('blocked');
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: 'var(--danger, #C0392B)',
                  }}
                >
                  Block {post.memberName}
                </button>
              </div>
            )}
          </div>
        )}
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
            <div
              className="post-banner"
              data-kind={kind}
              ref={firesConfetti ? bannerRef : undefined}
              role={firesConfetti ? 'button' : undefined}
              onClick={firesConfetti ? () => fireBanner(bannerRef.current, kind) : undefined}
            >
              <BannerMotif kind={kind} />
              <div className="pb-eyebrow">{post.eyebrow ?? KIND_EYEBROW[kind] ?? badge.label}</div>
              <div className="pb-title">{post.title}</div>
              {kind === 'game_won' ? (
                post.place && <div className="pb-place">{post.place}</div>
              ) : kind !== 'joined' ? (
                <div className="pb-prog">
                  <div className="pb-prog-track">
                    <span />
                  </div>
                  <div className="pb-prog-count">{post.progress ? `${post.progress} ✓` : '✓'}</div>
                </div>
              ) : null}
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
  const swipe = useSwipeDismiss(onClose, { right: true });
  const cleared = completed.size;
  const pct = Math.round((cleared / TOTAL_HANDS) * 100);
  const handle = member.name.toLowerCase().replace(/\s+/g, '');
  // A couple of "recent mahjs" drawn from their cleared hands.
  const recent = SAMPLE_CARD.hands.filter((h) => completed.has(h.id)).slice(0, 2);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="sheet member-sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
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

// On-device directory of discoverable players, so search is usable before the
// cloud backend is live. Swapped for real account search once cloud is on.
const SAMPLE_PLAYERS: CloudFriend[] = [
  { id: 'sp-ruth', username: 'Ruth', handle: 'ruthtiles', avatar: { face: 'crack', color: '#E8455F' } },
  { id: 'sp-esther', username: 'Esther', handle: 'estherbam', avatar: { face: 'bam', color: '#1FA85B' } },
  { id: 'sp-grace', username: 'Grace', handle: 'gracem', avatar: { face: 'dot', color: '#2F80ED' } },
  { id: 'sp-dottie', username: 'Dottie', handle: 'dottie', avatar: { face: 'flower', color: '#E84C8A' } },
  { id: 'sp-sylvia', username: 'Sylvia', handle: 'sylviak', avatar: { face: 'dragon', char: '中', color: '#C0392B' } },
  { id: 'sp-joan', username: 'Joan', handle: 'joanjoker', avatar: { face: 'joker', color: '#7C5CE0' } },
  { id: 'sp-florence', username: 'Florence', handle: 'flo', avatar: { face: 'wind', char: '東', color: '#2C3A57' } },
  { id: 'sp-marlene', username: 'Marlene', handle: 'marlene', avatar: { face: 'dot', color: '#F5A524' } },
];

export function AddFriendSheet({
  onAdd,
  onClose,
}: {
  onAdd: (name: string, avatar: TileAvatar) => void;
  onClose: () => void;
}) {
  // Friends are real accounts — you find them by searching usernames (cloud) or
  // a local sample directory (on-device), then invite people who aren't on the
  // app yet. No hand-made name + icon.
  const cloud = isCloudEnabled();
  const swipe = useSwipeDismiss(onClose);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<CloudFriend[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setResults([]);
      setSearching(false);
      return;
    }
    // On-device mode: filter the local sample directory (no network).
    if (!cloud) {
      const ql = query.replace(/^@/, '').toLowerCase();
      setResults(
        SAMPLE_PLAYERS.filter(
          (p) => p.username.toLowerCase().includes(ql) || p.handle.toLowerCase().includes(ql),
        ),
      );
      setSearching(false);
      return;
    }
    let live = true;
    setSearching(true);
    const t = setTimeout(() => {
      cloudSearchProfiles(query)
        .then((r) => live && setResults(r))
        .finally(() => live && setSearching(false));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, cloud]);

  function addUser(u: CloudFriend) {
    if (cloud) void cloudAddFriend(u.id);
    onAdd(u.username, u.avatar);
    onClose();
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
        <div className="grab" />
        <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <IconUsers size={20} /> Find Friends
        </h2>
        <p className="sheet-sub">Search players by username, or invite someone new.</p>

        <label className="lbl">Search players</label>
        <input
          className="field"
          value={q}
          autoFocus
          maxLength={30}
          placeholder="@username or name"
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="search-results">
          {searching && <p className="search-empty">Searching…</p>}
          {!searching && q.trim() && results.length === 0 && (
            <p className="search-empty">
              No players found for “{q.trim()}”. Invite them to join below.
            </p>
          )}
          {results.map((u) => (
            <div key={u.id} className="search-row">
              <Avatar avatar={u.avatar} size={36} />
              <div className="search-id">
                <div className="search-name">{u.username}</div>
                <div className="search-handle">@{u.handle}</div>
              </div>
              <button className="pick-chip" onClick={() => addUser(u)}>
                Add
              </button>
            </div>
          ))}
          {!cloud && !q.trim() && (
            <p className="gated-note">
              Real player search across accounts arrives with sign-in. Try typing a name to find
              demo players, or invite friends below.
            </p>
          )}
        </div>

        <div style={{ height: 1.5, background: 'var(--hairline)', margin: '16px 0' }} />

        <button
          className="btn"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={inviteContacts}
        >
          <IconContacts size={18} /> Invite From Contacts
        </button>

        <button className="btn ghost" style={{ marginTop: 10 }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
