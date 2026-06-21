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

export const CHALLENGES: Challenge[] = [
  {
    id: 'newyear',
    name: 'New Year, New Card',
    emoji: '🎆',
    season: 'Winter',
    blurb: 'Ring in the year — clear every hand in the 2026 section.',
    months: [11, 0, 1],
    match: (h) => h.category === '2026',
  },
  {
    id: 'flowers',
    name: 'Flower Festival',
    emoji: '🌸',
    season: 'Spring',
    blurb: 'Bloom season! Win any flower-forward hand (look for the F’s).',
    months: [2, 3, 4],
    match: (h) => /F/.test(h.notation),
  },
  {
    id: 'summer',
    name: 'Summer Evens',
    emoji: '☀️',
    season: 'Summer',
    blurb: 'Hot streak — clear the 2468 even-number hands.',
    months: [5, 6, 7],
    match: (h) => h.category === '2468',
  },
  {
    id: 'dragons',
    name: 'Dragon Days',
    emoji: '🐉',
    season: 'Autumn',
    blurb: 'Chase the Winds + Dragons hands as the leaves turn.',
    months: [8, 9, 10],
    match: (h) => h.category === 'Winds + Dragons',
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
