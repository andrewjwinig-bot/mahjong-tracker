// Seasonal challenges — a rotating quarterly goal that highlights a themed set
// of rows to clear. Adds a recurring "season" layer on top of the yearlong card.

import type { Hand, MahjongCard } from './types';

export interface Challenge {
  id: string;
  name: string;
  emoji: string;
  season: string;
  blurb: string;
  /** 0-based months this challenge is active. */
  months: number[];
  /** Which hands count toward the challenge. */
  match: (h: Hand) => boolean;
}

// The four seasons partition the card into non-overlapping category sets, so
// completing all four challenges completes the whole card.
const inCats = (cats: string[]) => (h: Hand) => cats.includes(h.category);

export const CHALLENGES: Challenge[] = [
  {
    id: 'newyear',
    name: 'New Year, New Card',
    emoji: '🎆',
    season: 'Winter',
    blurb: 'New-year showstoppers — clear 2026, Singles + Pairs, and Quints.',
    months: [11, 0, 1],
    match: inCats(['2026', 'Singles + Pairs', 'Quints']),
  },
  {
    id: 'flowers',
    name: 'Flower Festival',
    emoji: '🌸',
    season: 'Spring',
    blurb: 'Watch your runs bloom — clear Consecutive Run + Any Like Numbers.',
    months: [2, 3, 4],
    match: inCats(['Consecutive Run', 'Any Like Numbers']),
  },
  {
    id: 'summer',
    name: 'Summer Numbers',
    emoji: '☀️',
    season: 'Summer',
    blurb: 'Sunny multiples — clear the 2468 and 369 hands.',
    months: [5, 6, 7],
    match: inCats(['2468', '369']),
  },
  {
    id: 'dragons',
    name: 'Dragon Days',
    emoji: '🐉',
    season: 'Autumn',
    blurb: 'Honors & odds — clear Winds + Dragons and 13579.',
    months: [8, 9, 10],
    match: inCats(['Winds + Dragons', '13579']),
  },
];

export function activeChallenge(date = new Date()): Challenge {
  const m = date.getMonth();
  return CHALLENGES.find((c) => c.months.includes(m)) ?? CHALLENGES[0];
}

export function challengeProgress(
  ch: Challenge,
  card: MahjongCard,
  handCounts: Record<string, number>,
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const h of card.hands) {
    if (!ch.match(h)) continue;
    total += 1;
    if ((handCounts[h.id] ?? 0) > 0) done += 1;
  }
  return { done, total };
}

/** A short label for when a challenge runs, e.g. "Mar–May". */
export function seasonWindow(ch: Challenge): string {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sorted = [...ch.months].sort((a, b) => a - b);
  // handle the winter wrap (Dec, Jan, Feb)
  if (ch.months.includes(11) && ch.months.includes(0)) return 'Dec–Feb';
  return `${names[sorted[0]]}–${names[sorted[sorted.length - 1]]}`;
}
