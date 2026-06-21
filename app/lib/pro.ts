// Local "Pro" entitlement flag. This is a UI scaffold only — real purchases
// must go through App Store / Play in-app purchase before launch. For now the
// upgrade button flips this flag locally so premium content can be previewed.

const K = 'mahj.pro';

export function isPro(): boolean {
  try {
    return localStorage.getItem(K) === '1';
  } catch {
    return false;
  }
}

export function setPro(on: boolean): void {
  try {
    localStorage.setItem(K, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}
