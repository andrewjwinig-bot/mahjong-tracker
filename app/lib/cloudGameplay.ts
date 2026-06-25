// Cloud sync for per-user gameplay: hand progress, wins journal, custom card.
// Dormant until cloud is configured (every function no-ops without a session).

import { getSupabase } from './supabase';

async function uid(): Promise<string | null> {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user?.id ?? null;
}

// ---- Hand progress --------------------------------------------------------

export async function cloudLoadProgress(): Promise<Record<string, number>> {
  const sb = await getSupabase();
  const id = await uid();
  if (!sb || !id) return {};
  const { data } = await sb.from('hand_progress').select('hand_id, count').eq('user_id', id);
  const out: Record<string, number> = {};
  (data ?? []).forEach((r) => (out[r.hand_id as string] = r.count as number));
  return out;
}

export async function cloudSetProgress(handId: string, count: number): Promise<void> {
  const sb = await getSupabase();
  const id = await uid();
  if (!sb || !id) return;
  await sb.from('hand_progress').upsert({ user_id: id, hand_id: handId, count });
}

/** Upsert many hand counts at once (used by the first-login migration / sync). */
export async function cloudUpsertProgress(counts: Record<string, number>): Promise<void> {
  const sb = await getSupabase();
  const id = await uid();
  if (!sb || !id) return;
  const rows = Object.entries(counts).map(([hand_id, count]) => ({ user_id: id, hand_id, count }));
  if (rows.length) await sb.from('hand_progress').upsert(rows);
}

// ---- Wins journal ---------------------------------------------------------

export interface CloudWin {
  id: string;
  hand_id: string | null;
  hand_label: string | null;
  note: string;
  photo_url: string | null;
  created_at: string;
}

export async function cloudLoadWins(): Promise<CloudWin[]> {
  const sb = await getSupabase();
  const id = await uid();
  if (!sb || !id) return [];
  const { data } = await sb
    .from('wins')
    .select('id, hand_id, hand_label, note, photo_url, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false });
  return (data ?? []) as CloudWin[];
}

/**
 * Insert-or-update a win by its (UUID) id. Passing the client-generated id +
 * created_at keeps wins reconciled across devices and makes the migration
 * idempotent (re-running never duplicates). Photos sync separately as URLs.
 */
export async function cloudUpsertWin(w: {
  id: string;
  hand_id: string | null;
  hand_label: string | null;
  note: string;
  photo_url: string | null;
  created_at: string;
}): Promise<void> {
  const sb = await getSupabase();
  const id = await uid();
  if (!sb || !id) return;
  await sb.from('wins').upsert({ user_id: id, ...w });
}

export async function cloudDeleteWin(id: string): Promise<void> {
  const sb = await getSupabase();
  if (!sb) return;
  await sb.from('wins').delete().eq('id', id);
}

// ---- Custom card ----------------------------------------------------------

export async function cloudLoadCustomCard(): Promise<{ year: number; hands: unknown[] } | null> {
  const sb = await getSupabase();
  const id = await uid();
  if (!sb || !id) return null;
  const { data } = await sb.from('custom_cards').select('year, hands').eq('user_id', id).single();
  return data ? { year: data.year as number, hands: (data.hands as unknown[]) ?? [] } : null;
}

export async function cloudSaveCustomCard(year: number, hands: unknown[]): Promise<void> {
  const sb = await getSupabase();
  const id = await uid();
  if (!sb || !id) return;
  await sb.from('custom_cards').upsert({ user_id: id, year, hands });
}
