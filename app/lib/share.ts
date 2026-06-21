// Shared helpers for building a "share your mahj" payload.

import type { Win } from './types';

export const appUrl = (): string => (typeof window !== 'undefined' ? window.location.origin : '');

export function captionFor(win: Win): string {
  return win.handLabel
    ? `I just got MAHJ with ${win.handLabel}! 🀄🎉 Chasing all 70 hands on my 2026 card.`
    : `I just got MAHJ! 🀄🎉 Chasing all 70 hands on my 2026 card.`;
}
