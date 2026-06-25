// "Manage your data" — local export + full deletion. Satisfies the
// access/portability + account-deletion expectations (and Apple's deletion
// requirement) for the on-device version; extend these to call the backend
// once accounts ship.

import * as db from './storage';
import { downloadBlob } from './shareCard';

const LS_PREFIX = 'mahj.';
const DB_NAME = 'mahjong-tracker';

function localStorageDump(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LS_PREFIX)) out[k] = localStorage.getItem(k) ?? '';
    }
  } catch {
    /* ignore */
  }
  return out;
}

/** Build a JSON export of the user's local data and download it. */
export async function exportData(): Promise<void> {
  const [handCounts, handNotes, wins, profile] = await Promise.all([
    db.loadHandCounts(),
    db.loadHandNotes(),
    db.loadWins(),
    db.getMeta<unknown>('social.profile', null),
  ]);

  const payload = {
    app: 'Club Mahj',
    exportedAt: new Date().toISOString(),
    note: 'Photos and on-device social/table content are not included in this export.',
    settings: localStorageDump(),
    profile,
    cardProgress: handCounts,
    handNotes,
    wins: wins.map((w) => ({ ...w, photo: undefined, hasPhoto: !!w.photo })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `mahjong-tracker-data-${Date.now()}.json`);
}

export interface ImportSummary {
  hands: number;
  notes: number;
  wins: number;
  profileRestored: boolean;
}

/**
 * Restore data from a previously exported JSON file (device-to-device backup,
 * no cloud). Merges onto whatever's already here: card progress + notes are
 * overwritten per-hand, wins are added (deduped by id), settings + profile are
 * restored. Photos aren't part of the export, so they aren't restored.
 */
export async function importData(file: File): Promise<ImportSummary> {
  const text = await file.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file isn’t valid JSON.');
  }
  // Accept the current marker and the legacy "Mahjong Tracker" one (pre-rename).
  if (!data || (data.app !== 'Club Mahj' && data.app !== 'Mahjong Tracker')) {
    throw new Error('That doesn’t look like a Club Mahj backup.');
  }

  const summary: ImportSummary = { hands: 0, notes: 0, wins: 0, profileRestored: false };

  // Settings (localStorage) — only our own namespaced keys.
  if (data.settings && typeof data.settings === 'object') {
    try {
      for (const [k, v] of Object.entries(data.settings)) {
        if (k.startsWith(LS_PREFIX) && typeof v === 'string') localStorage.setItem(k, v);
      }
    } catch {
      /* ignore */
    }
  }

  // Profile lives in IndexedDB meta.
  if (data.profile) {
    await db.setMeta('social.profile', data.profile);
    summary.profileRestored = true;
  }

  // Per-hand win counts.
  if (data.cardProgress && typeof data.cardProgress === 'object') {
    for (const [handId, count] of Object.entries(data.cardProgress)) {
      const n = Number(count);
      if (handId && Number.isFinite(n) && n > 0) {
        await db.setHandCount(handId, n);
        summary.hands += 1;
      }
    }
  }

  // Per-hand notation overrides.
  if (data.handNotes && typeof data.handNotes === 'object') {
    for (const [handId, note] of Object.entries(data.handNotes)) {
      if (handId && typeof note === 'string') {
        await db.setHandNote(handId, note);
        summary.notes += 1;
      }
    }
  }

  // Wins journal (photos not included). Dedupe against existing ids.
  if (Array.isArray(data.wins)) {
    const existing = new Set((await db.loadWins()).map((w) => w.id));
    for (const w of data.wins) {
      if (!w || typeof w.id !== 'string' || existing.has(w.id)) continue;
      await db.saveWin({
        id: w.id,
        handId: typeof w.handId === 'string' ? w.handId : null,
        handLabel: typeof w.handLabel === 'string' ? w.handLabel : null,
        note: typeof w.note === 'string' ? w.note : '',
        photo: null,
        createdAt: Number(w.createdAt) || Date.now(),
      });
      summary.wins += 1;
    }
  }

  return summary;
}

/** Erase all locally-stored data (localStorage keys + the IndexedDB database). */
export async function deleteAllData(): Promise<void> {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LS_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }

  await new Promise<void>((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}
