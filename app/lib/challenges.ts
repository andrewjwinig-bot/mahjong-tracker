// Seasonal challenges — a rotating quarterly goal that highlights a themed set
// of rows to clear. Adds a recurring "season" layer on top of the yearlong card.

import type { Hand, MahjongCard } from './types';

export interface Challenge {
  id: string;
  name: string;
  emoji: string;
  season: string;
  blurb: string;
}

// Five seasons, themed to the calendar (with a year-end 5th). Each season has a
// thematic CORE (its signature hands — the year, flowers, winds, dragons,
// concealed) and is then filled evenly to ~13, so seasons stay balanced, spread
// across many sections, and clearing all five clears the card. `SIGNATURE`
// order matches CHALLENGES and sets the assignment priority.
export const CHALLENGES: Challenge[] = [
  {
    id: 'newyear',
    name: 'New Year, New Card',
    emoji: '🎆',
    season: 'Winter',
    blurb: 'Ring in the year — the 2026 hands lead, with a spread more from across the card.',
  },
  {
    id: 'spring',
    name: 'Spring Bloom',
    emoji: '🌸',
    season: 'Spring',
    blurb: 'Bloom season — built around the flower (F) hands, plus a fresh spread more.',
  },
  {
    id: 'summer',
    name: 'Summer Sun',
    emoji: '☀️',
    season: 'Summer',
    blurb: 'Summer breezes — the wind hands (N·E·W·S) and a sunny spread from the card.',
  },
  {
    id: 'autumn',
    name: 'Autumn Dragons',
    emoji: '🐉',
    season: 'Autumn',
    blurb: 'Chase the dragons (D) — the autumn set, rounded out from across the card.',
  },
  {
    id: 'yearsend',
    name: 'Year’s End',
    emoji: '🎁',
    season: 'Holidays',
    blurb: 'Close out the year with the tricky concealed hands, plus a final spread.',
  },
];

// A season's signature "core" test, in the same order as CHALLENGES (this is the
// assignment priority when a hand matches more than one).
const SIGNATURE: ((h: Hand) => boolean)[] = [
  (h) => /2026/.test(h.notation), // the year
  (h) => /F/.test(h.notation), // flowers
  (h) => /(NN|EE|WW|SS|NEWS)/.test(h.notation), // winds
  (h) => /D/.test(h.notation), // dragons
  (h) => !!h.concealed, // concealed
];

// Assign every hand to exactly one season: first fill each season's signature
// core (capped so seasons stay even), then deal the remainder to the emptiest
// season. Deterministic per card, cached so it's computed once.
const assignCache = new WeakMap<MahjongCard, Map<string, number>>();
function assignmentFor(card: MahjongCard): Map<string, number> {
  const cached = assignCache.get(card);
  if (cached) return cached;
  const n = CHALLENGES.length;
  const cap = Math.ceil(card.hands.length / n);
  const seatCount = new Array<number>(n).fill(0);
  const map = new Map<string, number>();
  // Pass 1 — signature cores (priority = CHALLENGES order), capped at `cap`.
  for (const h of card.hands) {
    for (let s = 0; s < n; s++) {
      if (SIGNATURE[s](h) && seatCount[s] < cap) {
        map.set(h.id, s);
        seatCount[s] += 1;
        break;
      }
    }
  }
  // Pass 2 — fill the rest into the emptiest season (card order for stability).
  for (const h of card.hands) {
    if (map.has(h.id)) continue;
    let s = 0;
    for (let x = 1; x < n; x++) if (seatCount[x] < seatCount[s]) s = x;
    map.set(h.id, s);
    seatCount[s] += 1;
  }
  assignCache.set(card, map);
  return map;
}

/** The set of hand ids that belong to a season, for the current card. */
export function challengeHandIds(card: MahjongCard, ch: Challenge): Set<string> {
  const k = CHALLENGES.indexOf(ch);
  const map = assignmentFor(card);
  const ids = new Set<string>();
  for (const h of card.hands) if (map.get(h.id) === k) ids.add(h.id);
  return ids;
}

// Five equal ~73-day windows across the year (from Jan 1), independent of the
// calendar seasons — one season is "active" at a time.
export function activeChallenge(date = new Date()): Challenge {
  const n = CHALLENGES.length;
  const start = new Date(date.getFullYear(), 0, 1).getTime();
  const dayOfYear = Math.floor((date.getTime() - start) / 86_400_000);
  const idx = Math.min(n - 1, Math.max(0, Math.floor((dayOfYear / 365) * n)));
  return CHALLENGES[idx];
}

export function challengeProgress(
  ch: Challenge,
  card: MahjongCard,
  handCounts: Record<string, number>,
): { done: number; total: number } {
  const k = CHALLENGES.indexOf(ch);
  const map = assignmentFor(card);
  let done = 0;
  let total = 0;
  for (const h of card.hands) {
    if (map.get(h.id) !== k) continue;
    total += 1;
    if ((handCounts[h.id] ?? 0) > 0) done += 1;
  }
  return { done, total };
}

/** The active-window date range for a season, e.g. "Jan 1 – Mar 14". */
export function seasonWindow(ch: Challenge): string {
  const n = CHALLENGES.length;
  const i = Math.max(0, CHALLENGES.indexOf(ch));
  const y = new Date().getFullYear();
  const startDay = Math.round((i / n) * 365);
  const endDay = Math.round(((i + 1) / n) * 365) - 1;
  const fmt = (day: number) =>
    new Date(y, 0, 1 + day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(startDay)} – ${fmt(endDay)}`;
}
