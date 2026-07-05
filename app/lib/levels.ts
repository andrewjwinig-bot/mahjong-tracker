// The Club Mahj progression system — turns the points you already bank into a
// level + rank you climb as you play. 100% personal and on-device, so it works
// from your very first Mahj (no crowd data, unlike the rarity stat).
//
//   Points  = the score you *bank from play*: each hand you win is worth its
//             printed value, plus a flat bonus for every scored game you win.
//   XP      = Points + a bonus for every trophy you've earned. XP is what
//             drives your level, so achievements accelerate the climb.
//
// Keeping "Points" (play output) separate from the trophy bonus avoids a loop
// with the points-milestone trophies, which read the banked-points number.

import type { MahjongCard } from './types';
import { loadResults } from './gameScorer';

/** Flat points banked for each scored game you finish on top of. */
export const GAME_WIN_POINTS = 100;
/** Bonus XP each earned trophy contributes toward your level. */
export const TROPHY_XP = 150;

/** Card points: every logged win worth its hand's printed value. */
export function cardPoints(card: MahjongCard, handCounts: Record<string, number>): number {
  let p = 0;
  for (const h of card.hands) p += (handCounts[h.id] ?? 0) * h.points;
  return p;
}

/** Points banked from finished scorer games this player won (matched by the
 *  profile name recorded as the game's winner). */
export function gameWinPoints(profileName?: string | null): number {
  const me = (profileName ?? '').trim().toLowerCase();
  if (!me) return 0;
  const wins = loadResults().filter(
    (r) => (r.winnerName ?? '').trim().toLowerCase() === me,
  ).length;
  return wins * GAME_WIN_POINTS;
}

// ---- Level curve ----------------------------------------------------------
// Cumulative XP to *reach* a level grows super-linearly, so early levels come
// quick and later ones feel earned. xpForLevel(n) = K·(n-1)^E.

const XP_K = 45;
const XP_EXP = 1.8;

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(XP_K * Math.pow(level - 1, XP_EXP));
}

export function levelForXp(xp: number): number {
  if (xp <= 0) return 1;
  // Invert the curve for a close guess, then nudge to the exact boundary so
  // float error never lands us a level off.
  let n = Math.max(1, Math.floor(Math.pow(xp / XP_K, 1 / XP_EXP)) + 1);
  while (xpForLevel(n + 1) <= xp) n += 1;
  while (n > 1 && xpForLevel(n) > xp) n -= 1;
  return n;
}

// ---- Ranks ----------------------------------------------------------------

export interface Rank {
  name: string;
  minLevel: number;
  emoji: string;
}

export const RANKS: Rank[] = [
  { name: 'Newcomer', minLevel: 1, emoji: '🪷' },
  { name: 'Table Regular', minLevel: 3, emoji: '🀄' },
  { name: 'Card Shark', minLevel: 5, emoji: '🦈' },
  { name: 'High Roller', minLevel: 8, emoji: '💎' },
  { name: 'Mahj Master', minLevel: 12, emoji: '🏆' },
  { name: 'Grand Master', minLevel: 17, emoji: '👑' },
];

export function rankForLevel(level: number): Rank {
  let r = RANKS[0];
  for (const x of RANKS) if (level >= x.minLevel) r = x;
  return r;
}

// ---- Aggregate ------------------------------------------------------------

export interface XpBreakdown {
  cardXp: number;
  gameXp: number;
  trophyXp: number;
  /** Banked points from play (card + games) — what the points trophies read. */
  points: number;
  /** Total XP driving your level (points + trophy bonus). */
  total: number;
}

export function computeXp(opts: {
  card: MahjongCard;
  handCounts: Record<string, number>;
  profileName?: string | null;
  trophiesEarned?: number;
}): XpBreakdown {
  const cardXp = cardPoints(opts.card, opts.handCounts);
  const gameXp = gameWinPoints(opts.profileName);
  const trophyXp = (opts.trophiesEarned ?? 0) * TROPHY_XP;
  const points = cardXp + gameXp;
  return { cardXp, gameXp, trophyXp, points, total: points + trophyXp };
}

export interface LevelState {
  level: number;
  rank: Rank;
  /** XP at the start of the current level. */
  floor: number;
  /** XP needed to reach the next level. */
  ceil: number;
  /** XP earned within the current level. */
  intoLevel: number;
  /** XP span of the current level. */
  span: number;
  /** XP remaining to the next level. */
  toNext: number;
  /** 0–1 progress toward the next level. */
  progress: number;
}

export function levelState(totalXp: number): LevelState {
  const level = levelForXp(totalXp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const span = Math.max(1, ceil - floor);
  const intoLevel = Math.max(0, totalXp - floor);
  return {
    level,
    rank: rankForLevel(level),
    floor,
    ceil,
    intoLevel,
    span,
    toNext: Math.max(0, ceil - totalXp),
    progress: Math.min(1, intoLevel / span),
  };
}

// ---- Level-up detection ---------------------------------------------------
// Persist the last level we celebrated so a fresh level-up can pop a toast
// without re-firing on every render.

const K_SEEN_LEVEL = 'mahj.level';

export function loadSeenLevel(): number | null {
  try {
    const raw = localStorage.getItem(K_SEEN_LEVEL);
    return raw ? Number(raw) || 1 : null;
  } catch {
    return null;
  }
}

export function saveSeenLevel(level: number): void {
  try {
    localStorage.setItem(K_SEEN_LEVEL, String(level));
  } catch {
    /* ignore */
  }
}
