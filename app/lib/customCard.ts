// User-entered card. Lets players type the hands from their own (official)
// card so the app never ships a copy of it. Stored locally as plain JSON.

import type { Hand, MahjongCard } from './types';
import * as db from './storage';

const PHOTO_KEY = 'customCard.photo';

/** Optional reference photo of the user's physical card (stored in IndexedDB). */
export function loadCardPhoto(): Promise<Blob | null> {
  return db.getMeta<Blob | null>(PHOTO_KEY, null);
}
export function saveCardPhoto(blob: Blob): Promise<void> {
  return db.setMeta(PHOTO_KEY, blob);
}
export function clearCardPhoto(): Promise<void> {
  return db.setMeta(PHOTO_KEY, null);
}

export interface HandRow {
  category: string;
  notation: string;
  points: number;
  concealed: boolean;
}

const K = 'mahj.customCard';

export function buildCard(year: number, rows: HandRow[]): MahjongCard {
  const categories: string[] = [];
  const counters: Record<string, number> = {};
  const hands: Hand[] = [];
  for (const r of rows) {
    const notation = r.notation.trim().toUpperCase();
    if (!notation) continue;
    const category = r.category.trim() || 'My Hands';
    if (!categories.includes(category)) categories.push(category);
    const i = counters[category] ?? 0;
    counters[category] = i + 1;
    hands.push({
      id: `${category}-${i}`,
      category,
      notation,
      points: Number.isFinite(r.points) && r.points > 0 ? Math.round(r.points) : 25,
      concealed: !!r.concealed,
    });
  }
  return { year, source: 'custom', categories, hands };
}

export function loadCustomCard(): MahjongCard | null {
  try {
    const raw = localStorage.getItem(K);
    return raw ? (JSON.parse(raw) as MahjongCard) : null;
  } catch {
    return null;
  }
}

export function saveCustomCard(card: MahjongCard): void {
  try {
    localStorage.setItem(K, JSON.stringify(card));
  } catch {
    /* ignore */
  }
}

export function clearCustomCard(): void {
  try {
    localStorage.removeItem(K);
  } catch {
    /* ignore */
  }
}

// Whether the user has opted to explore with the built-in sample card. Until a
// real card is entered (or the sample is accepted), the Card tab shows a setup
// prompt instead of placeholder hands.
const SAMPLE_KEY = 'mahj.sampleOptIn';

export function sampleOptedIn(): boolean {
  try {
    return localStorage.getItem(SAMPLE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSampleOptIn(on = true): void {
  try {
    if (on) localStorage.setItem(SAMPLE_KEY, '1');
    else localStorage.removeItem(SAMPLE_KEY);
  } catch {
    /* ignore */
  }
}

export function rowsFromCard(card: MahjongCard): HandRow[] {
  return card.hands.map((h) => ({
    category: h.category,
    notation: h.notation,
    points: h.points,
    concealed: h.concealed,
  }));
}
