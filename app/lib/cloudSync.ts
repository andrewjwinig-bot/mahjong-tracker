// Local-first cloud sync for the signed-in user: gameplay (hand progress +
// wins), the custom card, and profile mirroring. Every function no-ops unless
// cloud is configured AND a user is signed in, so callers can run them
// unconditionally and the app behaves exactly as the on-device version when
// cloud is off or the user is signed out.
//
// The gameplay merge is intentionally BIDIRECTIONAL, which doubles as the
// "first-login migration": local-only data is pushed up, cloud-only data is
// pulled down, and conflicts resolve by max(count) for progress / union for
// wins. Because every write is an idempotent upsert keyed on a stable id, the
// sync is safe to run on every app load.

import { getSupabase, isCloudEnabled } from './supabase';
import * as cloud from './cloudGameplay';
import { cloudGetProfile } from './cloudAuth';
import { cloudSaveProfile } from './cloudProfile';
import type { Win, MahjongCard, Hand } from './types';
import type { Profile } from './social';

/** True only when cloud is configured AND a user is currently signed in. */
export async function cloudSignedIn(): Promise<boolean> {
  if (!isCloudEnabled()) return false;
  const sb = await getSupabase();
  if (!sb) return false;
  const { data } = await sb.auth.getUser();
  return !!data.user;
}

export interface GameplaySnapshot {
  handCounts: Record<string, number>;
  wins: Win[];
}

/**
 * Two-way merge of local + cloud gameplay. Returns the merged view to write
 * back locally, or null when cloud is off / signed out (caller keeps local).
 */
export async function syncGameplay(local: GameplaySnapshot): Promise<GameplaySnapshot | null> {
  if (!(await cloudSignedIn())) return null;

  const [cloudProgress, cloudWins] = await Promise.all([
    cloud.cloudLoadProgress(),
    cloud.cloudLoadWins(),
  ]);

  // Hand counts: max() per hand — a win count only ever grows.
  const handCounts: Record<string, number> = { ...cloudProgress };
  for (const [hand, count] of Object.entries(local.handCounts)) {
    handCounts[hand] = Math.max(handCounts[hand] ?? 0, count);
  }

  // Wins: union by id. Cloud rows carry no photo blob, so preserve a local one
  // when the same win exists on both sides.
  const byId = new Map<string, Win>();
  for (const w of cloudWins) {
    byId.set(w.id, {
      id: w.id,
      handId: w.hand_id,
      handLabel: w.hand_label,
      note: w.note ?? '',
      photo: null,
      createdAt: new Date(w.created_at).getTime(),
    });
  }
  for (const w of local.wins) {
    const prev = byId.get(w.id);
    byId.set(w.id, prev ? { ...prev, photo: w.photo ?? prev.photo } : w);
  }
  const wins = [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);

  // Push the union up so the cloud holds everything (idempotent upserts).
  await cloud.cloudUpsertProgress(handCounts);
  await Promise.all(
    wins.map((w) =>
      cloud.cloudUpsertWin({
        id: w.id,
        hand_id: w.handId,
        hand_label: w.handLabel,
        note: w.note,
        photo_url: null,
        created_at: new Date(w.createdAt).toISOString(),
      }),
    ),
  );

  return { handCounts, wins };
}

function rebuildCard(year: number, hands: Hand[]): MahjongCard {
  const categories: string[] = [];
  for (const h of hands) if (!categories.includes(h.category)) categories.push(h.category);
  return { year, source: 'custom', categories, hands };
}

/**
 * Sync the user's custom card. A local custom card wins (pushed up); otherwise
 * the cloud copy is pulled down. Returns the effective card, or the passed-in
 * local value when there's nothing to change.
 */
export async function syncCustomCard(local: MahjongCard | null): Promise<MahjongCard | null> {
  if (!(await cloudSignedIn())) return local;
  if (local && local.source === 'custom') {
    await cloud.cloudSaveCustomCard(local.year, local.hands);
    return local;
  }
  const remote = await cloud.cloudLoadCustomCard();
  if (remote && Array.isArray(remote.hands) && remote.hands.length) {
    return rebuildCard(remote.year, remote.hands as Hand[]);
  }
  return local;
}

/** Pull the cloud profile into a local social.Profile, or null. (Slice 2.) */
export async function pullCloudProfile(): Promise<Profile | null> {
  if (!(await cloudSignedIn())) return null;
  const p = await cloudGetProfile();
  if (!p) return null;
  // The avatar column is a TileAvatar stored as jsonb (typed loosely as string
  // faces by the auth layer); it conforms at runtime.
  return { name: p.username, handle: p.handle, bio: p.bio ?? '', avatar: p.avatar as Profile['avatar'] };
}

/** Mirror a local profile up to the cloud so it's discoverable by friends. */
export async function pushCloudProfile(p: Profile): Promise<void> {
  if (!(await cloudSignedIn())) return;
  try {
    await cloudSaveProfile(p);
  } catch {
    /* best-effort */
  }
}

// ---- Fire-and-forget mirrors for live writes ------------------------------
// These intentionally do not block the UI; local IndexedDB stays the source of
// truth and the next full syncGameplay() reconciles anything that failed.

export function mirrorHandCount(handId: string, count: number): void {
  void cloudSignedIn().then((ok) => {
    if (ok) void cloud.cloudSetProgress(handId, count);
  });
}

export function mirrorWin(w: Win): void {
  void cloudSignedIn().then((ok) => {
    if (!ok) return;
    void cloud.cloudUpsertWin({
      id: w.id,
      hand_id: w.handId,
      hand_label: w.handLabel,
      note: w.note,
      photo_url: null,
      created_at: new Date(w.createdAt).toISOString(),
    });
  });
}

export function mirrorRemoveWin(id: string): void {
  void cloudSignedIn().then((ok) => {
    if (ok) void cloud.cloudDeleteWin(id);
  });
}
