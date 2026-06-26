// Client side of "scan my card": turns a photo of the user's own card into
// editable hand rows. The user reviews and fixes the result before it's saved,
// and the card only ever lives on their device. Dormant unless the server has
// scanning configured (see app/api/scan-card/route.ts).

import type { HandRow } from './customCard';

/** Whether the Scan-my-card affordance is shown. Flip on once it's cleared. */
export const SCAN_ENABLED = process.env.NEXT_PUBLIC_CARD_SCAN === '1';

export type ScanResult =
  | { ok: true; year?: number; rows: HandRow[] }
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

    const data = (await res.json()) as { year?: number; hands?: unknown[] };
    const rows: HandRow[] = (Array.isArray(data.hands) ? data.hands : [])
      .map((h) => h as Partial<HandRow>)
      .filter((h) => typeof h.notation === 'string' && h.notation.trim())
      .map((h) => ({
        category: typeof h.category === 'string' ? h.category : '',
        notation: String(h.notation).trim(),
        points: Number.isFinite(h.points) && (h.points as number) > 0 ? Math.round(h.points as number) : 25,
        concealed: !!h.concealed,
      }));

    if (!rows.length) {
      return { ok: false, error: 'No hands found in that photo. Try a clearer shot of the full card.' };
    }
    return { ok: true, year: data.year, rows };
  } catch {
    return { ok: false, error: 'Couldn’t reach the scanner. Check your connection and try again.' };
  }
}
