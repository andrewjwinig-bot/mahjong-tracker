// Personal insights derived purely from on-device data (the card, per-hand win
// counts, and the wins journal). Pure functions so the profile sheet and any
// future "year in review" agree.

import type { MahjongCard, Win } from './types';

export interface CategoryStat {
  category: string;
  cleared: number;
  total: number;
  pct: number;
}

export interface Insights {
  /** Most-won hand, if any wins exist. */
  favorite: { label: string; count: number } | null;
  /** Per-category clear progress, richest first. */
  categories: CategoryStat[];
  /** Strongest category by clear %. */
  bestCategory: CategoryStat | null;
  mahjsLast7: number;
  mahjsLast30: number;
  avgPoints: number;
  /** Busiest weekday by mahj count, e.g. "Tuesday". */
  busiestDay: string | null;
  /** Longest run of consecutive calendar days with a mahj. */
  longestDailyRun: number;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY = 86_400_000;

function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function computeInsights(
  card: MahjongCard,
  handCounts: Record<string, number>,
  wins: Win[],
): Insights {
  // Favorite hand — highest win count on the current card.
  let favorite: Insights['favorite'] = null;
  for (const h of card.hands) {
    const c = handCounts[h.id] ?? 0;
    if (c > 0 && (!favorite || c > favorite.count)) favorite = { label: h.notation, count: c };
  }

  // Per-category clear progress.
  const categories: CategoryStat[] = card.categories.map((category) => {
    const hands = card.hands.filter((h) => h.category === category);
    const cleared = hands.filter((h) => (handCounts[h.id] ?? 0) > 0).length;
    const total = hands.length;
    return { category, cleared, total, pct: total ? Math.round((cleared / total) * 100) : 0 };
  });
  const ranked = [...categories].sort((a, b) => b.pct - a.pct || b.total - a.total);
  const bestCategory = ranked.find((c) => c.cleared > 0) ?? null;

  // Time-based stats from the wins journal.
  const now = Date.now();
  let mahjsLast7 = 0;
  let mahjsLast30 = 0;
  const byWeekday = new Array(7).fill(0);
  const days = new Set<string>();
  let points = 0;
  let mahjs = 0;

  for (const w of wins) {
    const age = now - w.createdAt;
    if (age <= 7 * DAY) mahjsLast7 += 1;
    if (age <= 30 * DAY) mahjsLast30 += 1;
    byWeekday[new Date(w.createdAt).getDay()] += 1;
    days.add(dayKey(w.createdAt));
    mahjs += 1;
    const hand = w.handId ? card.hands.find((h) => h.id === w.handId) : undefined;
    points += hand?.points ?? 0;
  }

  const maxDay = Math.max(...byWeekday);
  const busiestDay = maxDay > 0 ? WEEKDAYS[byWeekday.indexOf(maxDay)] : null;

  // Longest streak of consecutive calendar days with at least one mahj.
  const sorted = [...days].sort();
  let longestDailyRun = 0;
  let run = 0;
  let prev = '';
  for (const d of sorted) {
    if (prev && new Date(d).getTime() - new Date(prev).getTime() === DAY) run += 1;
    else run = 1;
    longestDailyRun = Math.max(longestDailyRun, run);
    prev = d;
  }

  return {
    favorite,
    categories,
    bestCategory,
    mahjsLast7,
    mahjsLast30,
    avgPoints: mahjs ? Math.round(points / mahjs) : 0,
    busiestDay,
    longestDailyRun,
  };
}
