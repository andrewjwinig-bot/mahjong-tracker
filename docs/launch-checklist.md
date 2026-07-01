# Launch-day checklist — Mahjong Tracker

The end-to-end runbook to take the app from on-device prototype to a shipped
App Store / Play Store release. Ordered roughly the way you'll do it. Deep-dives
live in the sibling docs:

- `backend.md` — Supabase (auth, DB, storage) activation
- `capacitor.md` — native wrapper + push notifications
- `monetization.md` — tiers, gating & in-app purchase wiring
- `store-listing.md` — marketing copy / metadata
- `qa-checklist.md` — pre-ship QA pass

> **Nothing here is required to keep using the app as-is.** Until you create a
> Supabase project and wrap natively, the app stays 100% on-device.

---

## Web build hardening (code-side)

**Shipped in code:**

- [x] Route-level + global **error boundaries** and a branded **404** so crashes
      and stray URLs recover gracefully (`app/error.tsx`, `global-error.tsx`,
      `not-found.tsx`).
- [x] Replaced blocking `alert()`s with an in-app **toast** (`showToast`).
- [x] **Favicon** (`app/icon.png`); **robots.txt** + **sitemap.xml** routes.
- [x] **CI** quality gate — typecheck + lint + build on every push/PR, with
      `NEXT_PUBLIC_DEMO_MODE=0` pinned so a demo-only build never goes green
      (`.github/workflows/ci.yml`).
- [x] README **license/copyright** filled (Black Pug Studios LLC, proprietary).

**Environment flips before the launch build (set in Vercel, then redeploy):**

- [ ] `NEXT_PUBLIC_DEMO_MODE=0` — ⚠️ production currently ships with demo data
      (fake friends/tables/feed) until this is set.
- [ ] `NEXT_PUBLIC_SITE_URL=<production domain>` — OG/share cards + sitemap/robots
      currently point at the Vercel preview URL.
- [ ] Card scanning: `ANTHROPIC_API_KEY` (server secret) **and**
      `NEXT_PUBLIC_CARD_SCAN=1` (surfaces the affordance). Request shape is
      already correct for Opus 4.8 — no code change needed.
- [ ] (recommended) Error/crash monitoring (e.g. Sentry); wire the analytics
      forwarding hook to a real sink.

---

## 0. Accounts & legal (do first; some have lead time)

- [ ] **Apple Developer Program** ($99/yr). Individual is fine; an **LLC** gives
      liability separation + keeps your legal name off the listing (needs a free
      D-U-N-S number — allow a few days). See the chat notes / your own counsel.
- [ ] **Google Play Developer** ($25 once) if shipping Android.
- [ ] Confirm the **non-affiliation disclaimer** (not NMJL) stays in the app
      (`AboutSheet`) and the store description. Don't use "National Mah Jongg
      League"/"NMJL" in the app name, subtitle, or keywords.
- [ ] Decide the bundle id, e.g. `com.yourco.mahjongtracker`.

## 1. Backend activation (Supabase) — see `backend.md`

> **Decision (this session): accounts + cloud sync ARE going live at launch.**
> Code audit verdict: the integration is **~95% done in code** — auth
> (sign-up / sign-in / returning user), two-way gameplay sync, the first-login
> data migration, and report/block moderation are all wired and the queries
> match the schema. **No app-code work remains** to turn it on; the steps below
> are Supabase infrastructure only.
> **Email confirmation: OFF** (frictionless sign-up) — chosen for launch; the
> onboarding assumes immediate sign-in, so leave "Confirm email" disabled in
> Supabase Auth (revisit later with custom SMTP if you want verified emails).

- [x] `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel.
- [ ] **Run the schema:** paste `docs/supabase-setup.sql` (all 6 migrations,
      idempotent) into the Supabase SQL editor and Run.
- [ ] **Create a public Storage bucket** named exactly `photos`.
- [ ] **Deploy the account-deletion function** (Apple requires in-app deletion):
      `supabase functions deploy delete-account` +
      `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=…`.
- [ ] **Auth → URL Configuration:** set Site URL to the production URL; confirm
      "Confirm email" is **off**.
- [ ] **At launch:** set `NEXT_PUBLIC_DEMO_MODE=0` in Vercel + redeploy (this is
      what swaps demo content for the real accounts experience).
- [ ] **Test on a Preview deploy** with demo off: onboarding → sign-up → log a
      win → sign out → sign in on another browser → data appears.
- [x] ~~Wire the gated cloud modules + first-login migration~~ — already wired
      (verified this session).
- [ ] **Live multiplayer scorer** (cross-account real-time scorepad): add the
      `0002_live_scorer.sql` migration + realtime wiring (see `backend.md`).
      The friend-pick UI and scoreboard avatars already ship; only the transport
      changes.
- [ ] Add **report/block** before enabling public user-generated content.

## 2. Native wrapper — see `capacitor.md`

> **Scaffolded in-repo:** `capacitor.config.ts` is committed (hosted-URL,
> appId `com.clubmahj.app`, splash + push configured), so `cap init` is done.

- [ ] On a Mac with Xcode: install the Capacitor deps listed at the top of
      `capacitor.config.ts`, set `CAP_SERVER_URL`, then `npx cap add ios` (+ android).
- [ ] Choose hosted-URL (fast content updates) vs. static-export (offline-first).
- [ ] Generate app icons + splash from a 1024×1024 source (current PWA icons are
      in `public/icons/`, regenerated via `npm run icons`).
- [ ] Push notifications: APNs key (iOS) / Firebase FCM (Android); store device
      tokens server-side; send via a Supabase Edge Function/cron.

## 3. Monetization / IAP — see `monetization.md`

> **Scaffolded in-repo:** `app/lib/billing.ts` is the provider abstraction
> (mock on web, RevenueCat on native — auto-selected). The Paywall CTA and the
> Settings "Restore purchases" row already call it; `pro.ts` stays the cached
> entitlement. Wiring real money is now just steps 1–2 below.

- [ ] Create products in App Store Connect / Play Console matching `PRODUCT_IDS`
      in `billing.ts` (`mahj.pro.monthly/annual/lifetime`); finalize prices to
      match `PLANS` in `pro.ts`.
- [ ] In RevenueCat: add the products to the default offering + a `pro`
      entitlement; `npm i @revenuecat/purchases-capacitor`; set
      `NEXT_PUBLIC_REVENUECAT_KEY`. (No UI changes — billing.ts picks it up.)
- [ ] Verify **Restore purchases** (Paywall + Settings) on a fresh install.
- [ ] Confirm zero third-party ad/tracking SDKs.

## 4. Privacy & compliance (gates review)

- [ ] Update the **Privacy Policy** (`/privacy`) practices to match accounts +
      cloud storage + any processors (Supabase, push, RevenueCat). Host URL ready.
- [ ] Keep in-app **account deletion** (wired to the `delete-account` edge
      function) + **data export/backup** (already built).
- [ ] Complete Apple **privacy "nutrition label"** / Play **Data Safety** honestly
      (with no ad SDKs this stays minimal: account data + user content only).
- [ ] GDPR/CCPA "manage your data" affordances present (export + delete).

## 5. Store listing & assets — see `store-listing.md`

- [ ] App name (≤30), subtitle, promo text, keywords, description (with disclaimer).
- [ ] Screenshots for required device sizes (capture Card, Feed, a theme, the
      live scorer, trophies/insights). Optional app preview video.
- [ ] Support URL + marketing URL; age rating questionnaire; category (e.g.
      Games / Board or Utilities).
- [ ] "What's New" text for the first release.

## 6. QA & release — see `qa-checklist.md`

- [ ] Run the QA checklist on a real device (PWA install, offline, themes,
      confetti/sound, reduced-motion, share sheet, scorer, backup/restore).
- [ ] Test IAP purchase + restore with sandbox/license testers.
- [ ] Verify deep links / legal pages open; Escape/back dismiss modals.
- [ ] Bump version + build number; archive in Xcode / build AAB.
- [ ] Submit for review. Have a TestFlight/internal-testing pass first.

## Post-launch

- [ ] Watch crash logs + the local analytics signal (share rate) once forwarded
      to a real sink.
- [ ] Seed the public feed / onboarding so day-one users see life.
- [ ] Plan the first content update (new card year, seasonal challenge refresh).
