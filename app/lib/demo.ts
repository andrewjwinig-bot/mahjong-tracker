// Demo vs. real data switch.
//
// "Demo" populates the app with seeded content — the sample card, fake friends,
// a demo feed, and seeded tables — so pages look alive while you design them.
// "Real" shows the honest empty app: no card until you scan one, no friends,
// an empty feed, and no tables.
//
// Two ways to set it:
//  • Build-time: NEXT_PUBLIC_DEMO_MODE = '1' (force demo) or '0' (force real).
//  • Runtime: a Settings toggle writes localStorage so you can flip between the
//    empty and populated states in the running app to preview both.
//
// Default (nothing set): demo OFF — real users get the honest app (no seeded
// friends/tables/feed; a real account + sync, an empty card to scan). Toggle
// demo ON *per device* in Settings to preview the seeded content while refining.
// NEXT_PUBLIC_DEMO_MODE still force-overrides globally when set ('1' = on
// everywhere, '0' = off everywhere) — leave it UNSET so the per-device toggle
// wins and every real user defaults to the real experience.

const RUNTIME_KEY = 'mahj.demoData';

export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === '1') return true;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === '0') return false;
  try {
    const v = localStorage.getItem(RUNTIME_KEY);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    /* SSR / no storage — fall through to default */
  }
  return false;
}

/** Persist the runtime demo toggle. Reload the app after calling to re-seed. */
export function setDemoData(on: boolean): void {
  try {
    localStorage.setItem(RUNTIME_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}
