// Rotating mahjong tips, tailored to the player's experience level. A stable
// "tip of the day" is chosen by date so it feels like a daily drop; shuffling
// cycles through the rest of that level's pool.

import type { Experience } from './account';

const BEGINNER: string[] = [
  'Year hands like 2026 are beginner-friendly — a great way to score your first clears.',
  'A pung is 3 of a kind, a kong is 4, a quint is 5 (only possible with jokers).',
  'Flowers are wild bonus tiles — many hands just need “FF” regardless of which flowers.',
  'Dragons pair with suits — Green with bams, Red with cracks, White (the “soap”) with dots.',
  'Stuck? Switch to the “To Go” filter to pick your next target hand.',
  'Call “Mahjong!” the instant your 14 tiles match, then log it before the tiles get scooped.',
  'Keep your jokers — they can’t be used in a pair or a single, only in pungs, kongs, and quints.',
];

const INTERMEDIATE: string[] = [
  'Keep two possible hands in mind until the Charleston ends — flexibility wins.',
  'In the Charleston, pass away tiles you don’t need early. Don’t get attached.',
  'Watch the discards: if a tile you need keeps getting tossed, pivot hands.',
  'There are 4 of every tile. If 3 are already out, the one you’re waiting on is nearly gone.',
  'Don’t expose more than you must — concealed hands score higher.',
  'Pick up a joker whenever you can — they’re the most flexible tile on the table.',
];

const EXPERT: string[] = [
  'Late game, switch to defense — read exposures and stop feeding the leader’s hand.',
  'Jokers can be redeemed from an exposed pung/kong by swapping the natural tile — plan for it.',
  'Track the wall: with a thin wall, favor hands needing fewer specific tiles.',
  'The Singles & Pairs hands pay the most but allow no jokers — only chase them with a strong start.',
  'Hold a “bait” tile to bluff your hand’s direction before the discard you actually need.',
  'Count your tiles-away every turn; commit to the fastest hand, not the prettiest.',
];

const POOLS: Record<Experience, string[]> = {
  beginner: BEGINNER,
  intermediate: [...BEGINNER.slice(0, 2), ...INTERMEDIATE],
  expert: [...INTERMEDIATE.slice(0, 2), ...EXPERT],
};

export function tipsFor(level: Experience): string[] {
  return POOLS[level];
}

/** Day-stable index into a pool (changes once per calendar day). */
export function tipOfTheDayIndex(poolLength: number, date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return poolLength ? day % poolLength : 0;
}
