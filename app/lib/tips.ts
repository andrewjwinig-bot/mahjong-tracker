// Rotating mahjong tips. A stable "tip of the day" is chosen by date so it
// feels like a daily drop; shuffling cycles through the rest.

export const TIPS: string[] = [
  'Keep your jokers — they can’t be used in a pair or a single, only in pungs, kongs, and quints.',
  'Stuck? Switch to the “To Go” filter to pick your next target hand.',
  'The Singles & Pairs hands are worth the most points — and must be played concealed.',
  'In the Charleston, pass away tiles you don’t need early. Don’t get attached.',
  'Keep two possible hands in mind until the Charleston ends — flexibility wins.',
  'Watch the discards: if a tile you need keeps getting tossed, pivot hands.',
  'Dragons pair with suits — Green with bams, Red with cracks, White (the “soap”) with dots.',
  'Year hands like 2026 are beginner-friendly — a great way to score your first clears.',
  'Call “Mahjong!” the instant your 14 tiles match, then log it before the tiles get scooped.',
  'Don’t expose more than you must — concealed hands score higher.',
  'There are 4 of every tile. If 3 are already out, the one you’re waiting on is nearly gone.',
  'Snap a photo of a pretty winning hand — it makes a great share card.',
  'A pung is 3 of a kind, a kong is 4, a quint is 5 (only possible with jokers).',
  'Flowers are wild bonus tiles — many hands just need “FF” regardless of which flowers.',
];

/** Day-stable tip index (changes once per calendar day). */
export function tipOfTheDayIndex(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return day % TIPS.length;
}
