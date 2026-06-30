// Shared helpers for building a "share your mahj" payload.

import type { Win } from './types';
import { TOTAL_HANDS } from './cardData';

export const appUrl = (): string => (typeof window !== 'undefined' ? window.location.origin : '');

export function captionFor(win: Win): string {
  return win.handLabel
    ? `I just got MAHJ with ${win.handLabel}! 🀄🎉 Logging it on Club Mahj — ${TOTAL_HANDS} hands on the 2026 card and counting.`
    : `I just got MAHJ! 🀄🎉 Logging it on Club Mahj — ${TOTAL_HANDS} hands on the 2026 card and counting.`;
}

/**
 * Friendly invite text — leads with the social side (playing together,
 * following friends, planning game days), not just racing to clear the card.
 */
export function inviteText(url?: string): string {
  const base =
    'Come play mahjong with me on Club Mahj! 🀄 Track your wins, follow friends, plan game days, and cheer each other on.';
  return url ? `${base} ${url}` : base;
}
