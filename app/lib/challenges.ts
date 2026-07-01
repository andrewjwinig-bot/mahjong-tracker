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

// The card year starts in April (the new NMJL card drops each April), so the
// seasons cycle April → March rather than Jan → Dec. Change this one constant if
// the card ever drops in a different month (0 = January … 3 = April).
const CARD_YEAR_START_MONTH = 3;

// Five seasons, in the order they go active across the card year (April → March),
// so each window lands in its real-world season. Each has a thematic CORE (its
// signature hands — flowers, winds, dragons, concealed, the year) and is then
// filled evenly to ~13, so seasons stay balanced, spread across many sections,
// and clearing all five clears the card.
export const CHALLENGES: Challenge[] = [
  {
    id: 'spring',
    name: 'Spring Bloom',
    emoji: '🌸',
    season: 'Spring',
    blurb: 'A fresh card blooms — chase the flower (F) hands as the new season opens.',
  },
  {
    id: 'summer',
    name: 'Summer Breeze',
    emoji: '☀️',
    season: 'Summer',
    blurb: 'Catch a summer breeze — the wind hands (N·E·W·S) carry the season.',
  },
  {
    id: 'autumn',
    name: 'Autumn Dragons',
    emoji: '🐉',
    season: 'Autumn',
    blurb: 'Chase the dragons (D) as the leaves turn.',
  },
  {
    id: 'yearsend',
    name: 'Year’s End',
    emoji: '🎁',
    season: 'Holidays',
    blurb: 'Close out the year with the tricky concealed hands.',
  },
  {
    id: 'finale',
    name: 'Home Stretch',
    emoji: '🏁',
    season: 'Finale',
    blurb: 'The card’s last leg — cap off the year (2026) hands before April’s new card drops.',
  },
];

// A season's signature "core" test, keyed by challenge id. `priority` breaks ties
// when a hand matches more than one core (lower = claimed first) — kept separate
// from the window order above so, e.g., New Year still claims the year hands even
// though its window comes last.
const CORE: Record<string, { test: (h: Hand) => boolean; priority: number }> = {
  finale: { test: (h) => /2026/.test(h.notation), priority: 0 }, // the year
  spring: { test: (h) => /F/.test(h.notation), priority: 1 }, // flowers
  summer: { test: (h) => /(NN|EE|WW|SS|NEWS)/.test(h.notation), priority: 2 }, // winds
  autumn: { test: (h) => /D/.test(h.notation), priority: 3 }, // dragons
  yearsend: { test: (h) => !!h.concealed, priority: 4 }, // concealed
};

// Season indices sorted by core priority (not window order).
const PRIORITY_ORDER = CHALLENGES.map((_, i) => i).sort(
  (a, b) => CORE[CHALLENGES[a].id].priority - CORE[CHALLENGES[b].id].priority,
);

// Assign every hand to exactly one season: first fill each season's signature
// core (capped so seasons stay even, in priority order), then deal the remainder
// to the emptiest season. Deterministic per card, cached so it's computed once.
const assignCache = new WeakMap<MahjongCard, Map<string, number>>();
function assignmentFor(card: MahjongCard): Map<string, number> {
  const cached = assignCache.get(card);
  if (cached) return cached;
  const n = CHALLENGES.length;
  const cap = Math.ceil(card.hands.length / n);
  const seatCount = new Array<number>(n).fill(0);
  const map = new Map<string, number>();
  // Pass 1 — signature cores (in priority order), capped at `cap`.
  for (const h of card.hands) {
    for (const s of PRIORITY_ORDER) {
      if (CORE[CHALLENGES[s].id].test(h) && seatCount[s] < cap) {
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

// The start of the card year (April 1) on or before `date`.
function cardYearStart(date: Date): Date {
  const y = date.getMonth() < CARD_YEAR_START_MONTH ? date.getFullYear() - 1 : date.getFullYear();
  return new Date(y, CARD_YEAR_START_MONTH, 1);
}

// Five equal ~73-day windows across the card year (from April 1), so each season
// is active in its real-world stretch — one season is "active" at a time.
export function activeChallengeIndex(date = new Date()): number {
  const n = CHALLENGES.length;
  const start = cardYearStart(date).getTime();
  const dayOfYear = Math.floor((date.getTime() - start) / 86_400_000);
  return Math.min(n - 1, Math.max(0, Math.floor((dayOfYear / 365) * n)));
}

export function activeChallenge(date = new Date()): Challenge {
  return CHALLENGES[activeChallengeIndex(date)];
}

/** The card's year (the April→March cycle the date falls in), e.g. 2026. */
export function cardYearLabel(date = new Date()): number {
  return cardYearStart(date).getFullYear();
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

/** The active-window date range for a season, e.g. "Apr 1 – Jun 12". */
export function seasonWindow(ch: Challenge): string {
  const n = CHALLENGES.length;
  const i = Math.max(0, CHALLENGES.indexOf(ch));
  const base = cardYearStart(new Date());
  const startDay = Math.round((i / n) * 365);
  const endDay = Math.round(((i + 1) / n) * 365) - 1;
  const fmt = (day: number) =>
    new Date(base.getFullYear(), base.getMonth(), base.getDate() + day).toLocaleDateString(
      undefined,
      { month: 'short', day: 'numeric' },
    );
  return `${fmt(startDay)} – ${fmt(endDay)}`;
}
