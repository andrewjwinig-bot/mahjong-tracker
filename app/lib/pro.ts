// Local "Pro" entitlement + pricing model. This is a UI scaffold only — real
// purchases must go through App Store / Play in-app purchase before launch.
// For now the upgrade button flips a local flag so premium content can be
// previewed. A tiny pub/sub lets the whole UI react the instant it changes.

const K = 'mahj.pro';

type Listener = () => void;
const listeners = new Set<Listener>();

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
  listeners.forEach((l) => l());
}

export function subscribePro(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Restore previous purchases. Stub for now — at native-wrap time this calls
 * StoreKit / Play Billing's restore and flips the flag if an entitlement is
 * found. Returns whether Pro is active afterward.
 */
export async function restorePurchases(): Promise<boolean> {
  // No store connected yet; nothing to restore.
  return isPro();
}

// ---- Pricing (display-only until native IAP is wired) ---------------------

export interface Plan {
  id: 'monthly' | 'annual' | 'lifetime';
  name: string;
  price: string;
  cadence: string;
  /** Small note, e.g. savings or "one-time". */
  note?: string;
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  { id: 'annual', name: 'Annual', price: '$14.99', cadence: '/year', note: 'Best value — under $1.25/mo', highlight: true },
  { id: 'monthly', name: 'Monthly', price: '$2.99', cadence: '/month' },
  { id: 'lifetime', name: 'Lifetime', price: '$24.99', cadence: 'once', note: 'Pay once, yours forever' },
];

/** Free plan limits. */
export const FREE_TABLE_LIMIT = 2;
