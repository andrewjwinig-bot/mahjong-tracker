// Tiny localStorage-backed boolean preferences (Settings toggles). All on-device
// — nothing is transmitted. Unknown/missing keys fall back to the given default.

const KEY = (k: string) => `mahj.pref.${k}`;

export function getPref(k: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(KEY(k));
    return v == null ? fallback : v === '1';
  } catch {
    return fallback;
  }
}

export function setPref(k: string, v: boolean): void {
  try {
    localStorage.setItem(KEY(k), v ? '1' : '0');
  } catch {
    /* ignore */
  }
}
