// Billing abstraction — keeps the paywall UI money-agnostic.
//
// Web / demo builds use MockBilling (the CTA previews Pro by flipping the local
// entitlement flag). A native Capacitor build with RevenueCat installed swaps in
// the store-backed provider — same interface, real purchases — selected at
// runtime. The native SDK is imported lazily so it never enters the web bundle.
//
// To go live (see docs/monetization.md):
//   1. Create the products below in App Store Connect / Play Console.
//   2. In RevenueCat, add them to the "default" offering and an entitlement
//      called `pro` (see PRO_ENTITLEMENT).
//   3. `npm i @revenuecat/purchases-capacitor` in the native project and set
//      NEXT_PUBLIC_REVENUECAT_KEY. No UI changes needed.

import { isPro, setPro } from './pro';
import type { Plan } from './pro';

export type PlanId = Plan['id'];

/** Store product identifiers — mirror these exactly in the stores. */
export const PRODUCT_IDS: Record<PlanId, string> = {
  monthly: 'mahj.pro.monthly',
  annual: 'mahj.pro.annual',
  lifetime: 'mahj.pro.lifetime',
};

/** RevenueCat entitlement that grants Pro. */
export const PRO_ENTITLEMENT = 'pro';

export interface BillingProvider {
  /** True when a real store is wired (native build); false on web/demo. */
  readonly storeBacked: boolean;
  configure(): Promise<void>;
  /** Buy a plan. Resolves true if Pro is active afterward. */
  purchase(planId: PlanId): Promise<boolean>;
  /** Restore prior purchases (Apple requires this). Resolves true if entitled. */
  restore(): Promise<boolean>;
}

// --- Web / demo: no real store ---------------------------------------------
const mockBilling: BillingProvider = {
  storeBacked: false,
  async configure() {
    /* nothing to set up */
  },
  async purchase() {
    setPro(true);
    return true;
  },
  async restore() {
    return isPro();
  },
};

// --- Native (Capacitor + RevenueCat) ---------------------------------------
// Loaded only inside a native shell with the plugin present. The module
// specifier is held in a variable + webpackIgnore so the web build never tries
// to resolve the (uninstalled) native package.
function nativeBilling(apiKey: string): BillingProvider {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let P: any = null;
  const load = async () => {
    if (!P) {
      const mod = '@revenuecat/purchases-capacitor';
      ({ Purchases: P } = await import(/* webpackIgnore: true */ mod as string));
    }
    return P;
  };
  const entitled = (info: any) => !!info?.entitlements?.active?.[PRO_ENTITLEMENT];
  return {
    storeBacked: true,
    async configure() {
      const rc = await load();
      await rc.configure({ apiKey });
    },
    async purchase(planId) {
      const rc = await load();
      const offerings = await rc.getOfferings();
      const pkgs = offerings?.current?.availablePackages ?? [];
      const pkg = pkgs.find((p: any) => p.product?.identifier === PRODUCT_IDS[planId]) ?? pkgs[0];
      if (!pkg) return false;
      const { customerInfo } = await rc.purchasePackage({ aPackage: pkg });
      const ok = entitled(customerInfo);
      setPro(ok);
      return ok;
    },
    async restore() {
      const rc = await load();
      const { customerInfo } = await rc.restorePurchases();
      const ok = entitled(customerInfo);
      setPro(ok);
      return ok;
    },
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

let provider: BillingProvider | null = null;

/** The active billing provider — store-backed on native, mock on web. */
export function getBilling(): BillingProvider {
  if (provider) return provider;
  const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_KEY;
  const isNative =
    typeof window !== 'undefined' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!(window as any).Capacitor?.isNativePlatform?.();
  provider = isNative && apiKey ? nativeBilling(apiKey) : mockBilling;
  void provider.configure();
  return provider;
}
