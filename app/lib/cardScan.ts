// Client side of "scan my card": turns a photo of the user's own card into
// editable hand rows. The user reviews and fixes the result before it's saved,
// and the card only ever lives on their device. Dormant unless the server has
// scanning configured (see app/api/scan-card/route.ts).

import type { HandRow } from './customCard';

// Whether the Scan-my-card affordance is shown. Runtime-toggleable (Settings)
// so one deployed build can demo with or without scanning — no rebuild. The env
// var just sets the default when the user hasn't chosen.
const SCAN_FLAG_KEY = 'mahj.scanEnabled';
const SCAN_ENV_DEFAULT = process.env.NEXT_PUBLIC_CARD_SCAN === '1';

export function getScanEnabled(): boolean {
  try {
    const v = localStorage.getItem(SCAN_FLAG_KEY);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    /* ignore */
  }
  return SCAN_ENV_DEFAULT;
}

export function setScanEnabled(on: boolean): void {
  try {
    localStorage.setItem(SCAN_FLAG_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

// A scanned row is a normal hand row plus the server's validation metadata, so
// the editor can flag lines that need a closer look (wrong tile count, odd
// points, low-confidence read). The extra fields are dropped when the card is
// saved — only category/notation/points/concealed persist.
export interface ScanRow extends HandRow {
  tileCount?: number;
  confidence?: 'high' | 'medium' | 'low';
  issues?: string[];
}

export interface ScanSummary {
  handCount: number;
  sectionCount: number;
  needsReview: number;
  tileFlags: number;
  lowConfidence: number;
}

export type ScanResult =
  | { ok: true; year?: number; rows: ScanRow[]; summary?: ScanSummary }
  | { ok: false; error: string };

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      // Strip the "data:<mime>;base64," prefix — the API wants raw base64.
      resolve(result.includes(',') ? result.slice(result.indexOf(',') + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function scanCardImage(blob: Blob): Promise<ScanResult> {
  try {
    const image = await blobToBase64(blob);
    const res = await fetch('/api/scan-card', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image, mediaType: blob.type || 'image/jpeg' }),
    });

    if (res.status === 503) {
      return { ok: false, error: 'Card scanning isn’t turned on yet.' };
    }
    if (!res.ok) {
      return { ok: false, error: 'Couldn’t read that photo. Try a clearer, well-lit shot of the whole card.' };
    }

    const data = (await res.json()) as { year?: number; hands?: unknown[]; summary?: ScanSummary };
    const rows: ScanRow[] = (Array.isArray(data.hands) ? data.hands : [])
      .map((h) => h as Partial<ScanRow>)
      .filter((h) => typeof h.notation === 'string' && h.notation.trim())
      .map((h) => ({
        category: typeof h.category === 'string' ? h.category : '',
        notation: String(h.notation).trim(),
        points: Number.isFinite(h.points) && (h.points as number) > 0 ? Math.round(h.points as number) : 25,
        concealed: !!h.concealed,
        tileCount: Number.isFinite(h.tileCount) ? Math.round(h.tileCount as number) : undefined,
        confidence:
          h.confidence === 'high' || h.confidence === 'low' || h.confidence === 'medium'
            ? h.confidence
            : undefined,
        issues: Array.isArray(h.issues) ? h.issues.filter((s) => typeof s === 'string') : undefined,
      }));

    if (!rows.length) {
      return { ok: false, error: 'No hands found in that photo. Try a clearer shot of the full card.' };
    }
    return { ok: true, year: data.year, rows, summary: data.summary };
  } catch {
    return { ok: false, error: 'Couldn’t reach the scanner. Check your connection and try again.' };
  }
}
