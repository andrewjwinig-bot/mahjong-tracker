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
 * Buy a plan / restore purchases. These delegate to the billing provider —
 * mock on web/demo (flips the local flag), RevenueCat/StoreKit on native — so
 * the paywall UI is identical in both worlds. Both resolve to whether Pro is
 * active afterward. (Dynamic import avoids a pro.ts ⇄ billing.ts cycle.)
 */
export async function purchasePlan(planId: Plan['id']): Promise<boolean> {
  const { getBilling } = await import('./billing');
  return getBilling().purchase(planId);
}

export async function restorePurchases(): Promise<boolean> {
  const { getBilling } = await import('./billing');
  return getBilling().restore();
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
  { id: 'annual', name: 'Annual', price: '$14.99', cadence: '/yr', note: 'Just $1.25/mo, billed yearly', highlight: true },
  { id: 'monthly', name: 'Monthly', price: '$2.99', cadence: '/mo', note: 'Cancel anytime' },
  { id: 'lifetime', name: 'Lifetime', price: '$24.99', cadence: 'once', note: 'Pay once, yours forever' },
];

/** Price string for the CTA / inline use, e.g. "$14.99/yr" or "$24.99 once". */
export function planPriceLabel(p: Plan): string {
  return p.cadence === 'once' ? `${p.price} once` : `${p.price}${p.cadence}`;
}

/** Free plan limits. */
export const FREE_TABLE_LIMIT = 2;
