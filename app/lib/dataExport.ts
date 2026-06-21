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
    app: 'Mahjong Tracker',
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
