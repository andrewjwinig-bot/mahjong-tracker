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

// Each season chases a *symbol* that recurs across the whole card (the year,
// flowers, number kongs, dragons), so a challenge pulls hands from many
// sections and keeps you playing the full card.
export const CHALLENGES: Challenge[] = [
  {
    id: 'newyear',
    name: 'New Year, New Card',
    emoji: '🎆',
    season: 'Winter',
    blurb: 'Ring in 2026 — win any hand featuring the year, from any section.',
    months: [11, 0, 1],
    match: (h) => /2026/.test(h.notation),
  },
  {
    id: 'flowers',
    name: 'Flower Festival',
    emoji: '🌸',
    season: 'Spring',
    blurb: 'Bloom season — win any flower-forward hand (the F’s) across the card.',
    months: [2, 3, 4],
    match: (h) => /F/.test(h.notation),
  },
  {
    id: 'summer',
    name: 'Summer Kongs',
    emoji: '☀️',
    season: 'Summer',
    blurb: 'Go big — win any hand with a number kong (four-of-a-kind), anywhere.',
    months: [5, 6, 7],
    match: (h) => /(\d)\1\1\1/.test(h.notation),
  },
  {
    id: 'dragons',
    name: 'Dragon Days',
    emoji: '🐉',
    season: 'Autumn',
    blurb: 'Chase the dragons — win any hand with a Dragon (D), wherever it lives.',
    months: [8, 9, 10],
    match: (h) => /D/.test(h.notation),
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
