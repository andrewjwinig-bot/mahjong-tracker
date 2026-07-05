// Difficulty-derived rarity for each hand — a day-one "how rare is this hand?"
// signal built purely from the card itself (a hand's point value + whether it's
// concealed), so it works from the very first player with zero crowd data.
//
// The harder a hand is to build, the fewer players clear it — so the printed
// point value is a solid stand-in for rarity until real games pile up. When
// enough wins are logged across players, the same tiers can be re-derived from
// the true "won by X% of players" crowd stat; every caller reads handRarity()
// so swapping the source later touches only this file.

import type { Hand } from './types';

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Rarity {
  tier: RarityTier;
  label: string;
  /** Estimated share of players who clear it — difficulty-derived (0–100). */
  clearPct: number;
  color: string;
  /** Whether it earns a per-row chip. Common/uncommon stay quiet to keep the
   *  list uncluttered — only the standout hands get a badge. */
  notable: boolean;
}

// Concealed hands are meaningfully harder (no jokers, nothing exposed), so they
// count for a few extra "difficulty points" when we bucket them.
function difficulty(h: Hand): number {
  return h.points + (h.concealed ? 5 : 0);
}

const TIERS: Record<RarityTier, Omit<Rarity, 'tier'>> = {
  common: { label: 'Common', color: '#8A94A6', clearPct: 70, notable: false },
  uncommon: { label: 'Uncommon', color: '#2E9E6B', clearPct: 45, notable: false },
  rare: { label: 'Rare', color: '#2E78C8', clearPct: 24, notable: true },
  epic: { label: 'Epic', color: '#8B5CF6', clearPct: 11, notable: true },
  legendary: { label: 'Legendary', color: '#C9871A', clearPct: 4, notable: true },
};

function tierFor(d: number): RarityTier {
  if (d <= 27) return 'common';
  if (d <= 35) return 'uncommon';
  if (d <= 48) return 'rare';
  if (d <= 58) return 'epic';
  return 'legendary';
}

export function handRarity(h: Hand): Rarity {
  const tier = tierFor(difficulty(h));
  return { tier, ...TIERS[tier] };
}

/** A short celebratory line for clearing a notable hand. */
export function rarityBlurb(tier: RarityTier): string {
  switch (tier) {
    case 'rare':
      return 'a rare one — nicely done!';
    case 'epic':
      return "an epic hand — that's a tough build!";
    case 'legendary':
      return 'one of the rarest hands on the card!';
    default:
      return 'nicely done!';
  }
}

export const RARITY_TIERS = TIERS;
