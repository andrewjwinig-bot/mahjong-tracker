# Monetization — tiers, gating & in-app purchase

Mahjong Tracker is **freemium with a single "Pro" unlock** — no third-party
ads. The tier *structure* and gating are already built and working in the app;
only the real money (App Store / Play billing) is left for native-wrap time,
because Apple/Google require purchases to go through their native IAP systems.

## Pricing (display-only until native IAP)

Defined in `app/lib/pro.ts` → `PLANS`. Prices are placeholders; finalize before
submission and mirror them as products in App Store Connect / Play Console.

| Plan | Price | Product type |
| --- | --- | --- |
| **Annual** (default / "Popular") | `$14.99 / year` | auto-renewing subscription |
| Monthly | `$2.99 / month` | auto-renewing subscription |
| Lifetime | `$24.99 once` | non-consumable (one-time) |

Rationale: annual is the anchor ("under $1.25/mo"); the cheap **lifetime** option
converts the hobbyist audience that dislikes subscriptions.

## What's free vs. Pro

| Feature | Free | Pro |
| --- | --- | --- |
| Card tracking, mahjs, streaks, trophies | ✅ | ✅ |
| **Live game scorer (live play, unlimited hands)** | ✅ | ✅ |
| Saved game history | last **1** game | unlimited |
| Rematch any past game / share a scorecard | — | ✅ |
| "Games won" stat on profile | — (played only) | ✅ |
| **Win history journal ("Your Mahjs")** | recent few | full history |
| **Win insights** (favorite hands, points over time, best categories, streak history) | summary teaser | full breakdown |
| **Per-win context** (which table, who was playing) | — | ✅ |
| **Export win history** (CSV) | — | ✅ |
| Themes | 5 standard | + Dragon / Joker / Midnight (+ wallpapers) |
| Avatar / tile packs | basic | full |
| Private tables | up to **2** (`FREE_TABLE_LIMIT`) | unlimited |
| Backup / restore, insights | ✅ | ✅ |
| Cloud sync, push notifications | — | ✅ (with accounts) |
| Supporter badge | — | ✅ |

**Design principle:** never gate the *live act* of scoring (that's the daily
habit). Gate the *record and extras* (history, rematch, share, win stats).

### Planned: deep win history (Pro) — not built yet

Win-history depth is a natural Pro lever — it rewards the most engaged players
without ever blocking a beginner from logging a hand. The intent (last four rows
of the table above):

- **Journal depth:** free shows a recent handful of "Your Mahjs"; Pro unlocks the
  full history. Gate in `CardTab` where the `wins` list renders, mirroring the
  scorer's `FREE_HISTORY` pattern.
- **Win insights:** a breakdown built on `app/lib/insights.ts` (`computeInsights`)
  — favorite hands, points over time, strongest categories, streak history. Free
  sees a teaser/summary; Pro sees the full view.
- **Per-win context:** record *which table* and *who was playing* when a mahj is
  logged. This needs a small data-model add (`tableId?` / `players?` on `Win` in
  `app/lib/types.ts`) plus optional pickers in the log-win sheet.
- **Export:** CSV of the full win history (reuse `app/lib/dataExport.ts`).

**Sequencing note:** capturing per-win context (table/players) is worth wiring
*early* — even before the Pro analytics ship — so that by launch users already
have a rich history to unlock, rather than it starting empty on day one. The
analytics/gating UI can follow with the backend milestone.

### Where gating lives in code

- `app/lib/pro.ts` — `isPro()`, `setPro()`, `subscribePro()`, `restorePurchases()`
  (stub), `PLANS`, `FREE_TABLE_LIMIT`.
- `app/lib/usePro.ts` — `usePro()` reactive hook (re-renders on unlock).
- `app/components/Paywall.tsx` — plan picker + Restore purchases + disclosure.
- `app/components/ProUpsell.tsx` — house "Go Pro" banner (Feed + Tables); never
  a third-party ad. Hidden once Pro.
- Theme locks: `app/components/SettingsSheet.tsx` (uses `theme.pro` from
  `app/lib/themePrefs.ts`).
- Table limit: `app/components/TablesTab.tsx`.
- Scorer history gate: `app/components/GameScorer.tsx` (`FREE_HISTORY = 1`).
- Profile win stats gate: `app/components/TrophyShelf.tsx`.

## No ads (decision of record)

Lead with the clean Pro upgrade; ship **zero third-party ad SDKs**. The only
"ad" real estate is our own `ProUpsell` banner. This keeps the premium look,
fits the audience/price point, and keeps the App Store privacy labels and
GDPR/CCPA posture simple (no tracking SDKs). If ad revenue is ever revisited,
prefer **rewarded** unlocks over banners/interstitials.

## Wiring real purchases (native)

Do this in the Capacitor shell (see `capacitor.md`). The app already isolates
the entitlement behind `pro.ts`, so this is a contained swap — the gating UI
doesn't change.

1. **Create products** in App Store Connect (and Play Console): two
   auto-renewing subscriptions (`pro.monthly`, `pro.annual`) in one
   subscription group + one non-consumable (`pro.lifetime`). Match `PLANS` ids.
2. **Add a billing plugin**, e.g. RevenueCat (`@revenuecat/purchases-capacitor`)
   — it wraps StoreKit 2 + Play Billing, handles receipts, restore, and renewal
   state, and saves writing server-side receipt validation by hand.
3. **Replace the mocks in `pro.ts`:**
   - On `Unlock Pro`, call the plugin's `purchase(plan)` instead of `setPro(true)`.
   - On success / active entitlement, call `setPro(true)` (keep the local flag as
     the cached entitlement so gating stays instant + offline).
   - Implement `restorePurchases()` with the plugin's `restorePurchases()` and
     flip `setPro()` from the returned entitlement.
   - Subscribe to entitlement changes (renewal/expiry) and call `setPro(active)`.
4. **Required store text** (already in the Paywall fine print): auto-renew terms,
   "manage in App Store settings", and links to Terms + Privacy.
5. **Test** with StoreKit sandbox testers / Play license testers before review.

## Pre-submission monetization checklist

- [ ] Finalize prices; create matching products in both stores.
- [ ] Replace `pro.ts` mock unlock + `restorePurchases()` with real billing.
- [ ] "Restore purchases" works on a fresh install (Apple requires it).
- [ ] Subscriptions show auto-renew disclosure + Terms/Privacy links on the paywall.
- [ ] Free experience is genuinely useful on its own (no hard wall on core use).
- [ ] No third-party ad/tracking SDKs included.
