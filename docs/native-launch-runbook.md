# Native App Store launch — the ordered runbook

The single, do-this-in-order checklist to take Club Mahj from the live web/PWA
to a real **App Store + Google Play** app with working **in-app purchases**.
Deep detail lives in the sibling docs (linked per step); this is the sequence.

> **Why this order:** App Store IAP can only be sold through the native app
> (Apple forbids selling digital goods in a web view), and the native shell
> points at your production domain — so **domain → native build → store products
> → RevenueCat → submit**. Do them out of order and you'll redo work.

Legend: 🧑 = you (accounts/Mac) · 🤖 = already done in code · ⏱ = has lead time.

---

## Phase 0 — Prerequisites (start the slow ones NOW)

- [ ] 🧑 ⏱ **Apple Developer Program** — $99/yr. Enrolling as **Black Pug Studios
      LLC** keeps your legal name off the listing but needs a free **D-U-N-S
      number**, which can take **several days** to issue. Start this first.
- [ ] 🧑 **Google Play Developer** — $25 one-time (skip if iOS-only at launch).
- [ ] 🧑 **A Mac with Xcode** (required to build/sign/submit iOS). No Mac? A
      cloud Mac (MacStadium / MacinCloud) works.
- [ ] 🧑 **RevenueCat account** (free tier is fine) — for cross-platform IAP.
- [ ] 🤖 Bundle id decided: **`com.clubmahj.app`** (in `capacitor.config.ts`).

---

## Phase 1 — Custom domain (do before the native build)

The native shell hard-points at your production URL, so lock the domain in first.

- [ ] 🧑 Buy the domain (e.g. `clubmahj.com`).
- [ ] 🧑 Vercel → Project → **Settings → Domains** → add it; follow the DNS steps.
- [ ] 🧑 Update env to match, then redeploy:
      - `NEXT_PUBLIC_SITE_URL=https://clubmahj.com`
      - Supabase → Auth → **URL Configuration** → Site URL = the same
- [ ] 🧑 Set `CAP_SERVER_URL=https://clubmahj.com` (used by `capacitor.config.ts`).

*(If you'd rather ship an offline-first bundle instead of pointing at the hosted
site, see `capacitor.md` Option B — but note the card-scan API route needs the
hosted origin, so Option A/hosted is simpler here.)*

---

## Phase 2 — Native project (on the Mac) → see `capacitor.md`

- [ ] 🧑 Install deps + add platforms (from the repo root on the Mac):
      ```bash
      npm i -D @capacitor/cli
      npm i @capacitor/core @capacitor/ios @capacitor/android \
            @capacitor/status-bar @capacitor/splash-screen @capacitor/app \
            @capacitor/push-notifications @capacitor/share @capacitor/haptics
      npx cap add ios && npx cap add android
      CAP_SERVER_URL=https://clubmahj.com npx cap sync
      ```
- [ ] 🧑 App icon + splash from a 1024×1024 source (`docs/capacitor.md` → Icons).
      The current logo is `public/icons/icon-512.png` / `npm run icons`.
- [ ] 🧑 `npx cap open ios` → set the Team/signing in Xcode → run on a device.
- [ ] 🧑 Verify in the native shell: onboarding, card scan, sign-in/sync, share
      sheet, safe-area insets. (Use `docs/qa-checklist.md`.)

---

## Phase 3 — Store products (App Store Connect / Play Console) → see `monetization.md`

- [ ] 🧑 Create the app record (name **Club Mahj**, bundle id `com.clubmahj.app`).
- [ ] 🧑 Create **3 in-app purchases** with these exact product IDs (they must
      match `PRODUCT_IDS` in `app/lib/billing.ts`):
      - `mahj.pro.monthly` (auto-renewing subscription)
      - `mahj.pro.annual` (auto-renewing subscription)
      - `mahj.pro.lifetime` (non-consumable)
- [ ] 🧑 Set prices to match the `PLANS` display copy in `app/lib/pro.ts` (adjust
      either side so they agree).
- [ ] 🤖 The Paywall UI + "Restore purchases" are built and already call billing.

---

## Phase 4 — RevenueCat (wire real payments) → see `monetization.md` → "Wiring real purchases"

- [ ] 🧑 Create a RevenueCat project; connect App Store Connect (+ Play) apps.
- [ ] 🧑 Add the 3 products to the **default offering**, and create an
      entitlement named **`pro`** (the code checks this — `ENTITLEMENT` in
      `billing.ts`).
- [ ] 🧑 Install the plugin in the native project: `npm i @revenuecat/purchases-capacitor`.
- [ ] 🧑 Set the public SDK key in Vercel: `NEXT_PUBLIC_REVENUECAT_KEY=…` → redeploy.
- [ ] 🤖 No UI changes — `getBilling()` auto-switches to store-backed purchases
      when it detects native + the key (else it stays the web mock).
- [ ] 🧑 Test a **sandbox** purchase + **Restore purchases** on a real device.

---

## Phase 5 — Store listing & assets → see `store-listing.md`

- [ ] 🧑 Paste name / subtitle / promo / keywords / description / "What's New"
      from `store-listing.md` (copy is drafted, all original).
- [ ] 🧑 Screenshots for required device sizes (Card, Feed, a theme, live scorer,
      trophies/insights). Optional app-preview video.
- [ ] 🧑 Support URL + marketing URL (your domain), category (Games / Board),
      age-rating questionnaire.
- [ ] 🧑 **Privacy "nutrition label" / Data Safety** — with no ad SDKs this is
      minimal: account data + user content only. Keep it honest.
- [ ] 🧑 Keep the **NMJL non-affiliation** disclaimer in the description (mirrors
      the in-app About sheet). Don't use "NMJL"/"National Mah Jongg League" in the
      name, subtitle, or keywords.

---

## Phase 6 — Submit

- [ ] 🧑 Bump version + build number; Xcode → Archive → upload to App Store Connect.
- [ ] 🧑 Do a **TestFlight** (iOS) / internal-testing (Play) pass first.
- [ ] 🧑 Submit for review. Note review can bounce on IAP metadata or the
      account-deletion path — the in-app **Delete my account** (About & Legal) is
      already wired to the deployed `delete-account` function, which satisfies
      Apple's deletion requirement.

---

## Phase 7 — After approval

- [ ] 🧑 Flip the App Store listing live; announce.
- [ ] 🧑 (Optional) Push notifications (APNs/FCM) — `capacitor.md` → Push.
- [ ] 🧑 Wire error monitoring (Sentry) + forward the share-rate analytics.

---

### What's already done in code (so you don't re-do it)
- `capacitor.config.ts` (hosted-URL shell, appId, splash) — 🤖
- `app/lib/billing.ts` — RevenueCat provider, product IDs, `pro` entitlement,
  auto-switch native/mock — 🤖
- Paywall + Restore purchases UI — 🤖
- `delete-account` edge function (Apple deletion requirement) — 🤖 (deployed)
- Store-listing copy — 🤖 (`store-listing.md`)
