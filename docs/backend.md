# Backend & App Store milestone

This is the plan to take Mahjong Tracker from a polished on-device prototype to
a real, synced, social app you can ship to the App Store. It’s built in safe,
reversible steps. **Until you create a Supabase project and set the env vars,
nothing changes — the app stays 100% on-device.**

## Architecture

- **Auth + database + storage:** [Supabase](https://supabase.com) (Postgres +
  Row Level Security, email/password auth, file storage for photos).
- **Client:** the existing Next.js PWA, with the `app/lib/*` data modules
  gaining a cloud-backed implementation behind a feature flag
  (`isCloudEnabled()` in `app/lib/supabase.ts`). Local mode remains the default
  and the offline fallback.
- **Native + push:** wrap the PWA with [Capacitor](https://capacitorjs.com) for
  iOS/Android builds and native push notifications (APNs / FCM). Web Push covers
  installed PWAs where supported.

## What’s in the repo already

- `supabase/migrations/0001_init.sql` — full schema (profiles, friendships,
  tables + membership, chat, date polls, table photos, public feed with
  likes/comments, per-user gameplay progress/wins/custom card) **with Row Level
  Security policies**.
- `app/lib/supabase.ts` — a lazily-created client that returns `null` unless
  `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.
- `.env.example` — the two variables to set.

## Setup (when you’re ready)

1. Create a project at supabase.com. Copy the **Project URL** and **anon public
   key** (Project Settings → API).
2. Run the migration: paste `supabase/migrations/0001_init.sql` into the SQL
   editor (or `supabase db push` with the CLI).
3. Create a **public Storage bucket** named `photos` for win/table images.
4. In **Vercel → Project → Settings → Environment Variables**, add
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then redeploy.
5. In Supabase **Auth → Providers**, keep Email enabled; set your site URL and
   (optionally) turn on email confirmations.

## Build sequence (what I’ll wire next)

1. **Auth** — connect the existing onboarding to `supabase.auth.signUp` /
   `signInWithPassword`; add sign-in for returning users and sign-out + real
   account deletion (`auth.admin`/RPC) in Settings.
2. **Profiles** — read/write the `profiles` row; replace the local profile.
3. **Gameplay sync** — mirror `hand_progress`, `wins`, and `custom_cards` to the
   cloud with local-first writes and background sync.
4. **Social** — back the feed, likes, comments, friends, and tables (chat,
   polls, photos) with Supabase + realtime subscriptions.
5. **Live multiplayer scorer** — turn the on-device scorepad into a shared,
   cross-account session (see below).
6. **Migration on first login** — offer to upload existing on-device data.
7. **Capacitor** — add the native shell, app icons/splash, and push.

## Live multiplayer scorer (cross-account, real-time)

Today the scorer is fully on-device: you add players (typed, or picked from your
friends with `GameScorer`'s friend chips) and the scorepad lives in
`localStorage` via `app/lib/gameScorer.ts`. The next step is letting everyone at
the table track the **same** game from their own phone in real time.

**New migration (`0002_live_scorer.sql`):**

- `game_sessions` — `id`, `host_id`, `code` (short join code), `status`
  (`active`/`ended`), `created_at`, `ended_at`.
- `session_players` — `session_id`, `user_id` (nullable for guests),
  `display_name`, `avatar` (jsonb), `seat`, `score`. One row per seat.
- `game_rounds` — `session_id`, `winner_player_id` (nullable = wall),
  `hand_label`, `value`, `self_pick`, `discarder_player_id`, `deltas` (jsonb),
  `created_at`.
- **RLS:** a member of a session (row in `session_players`) can read it and
  append rounds; only the host can end it. Reuse the `is_table_member()` pattern
  with an `is_session_player()` SECURITY DEFINER helper.

**Client wiring:**

- Keep `gameScorer.ts`'s pure scoring (`computeDeltas`, payouts) — it's the
  single source of truth for both local and cloud games.
- Add a cloud-backed mode behind `isCloudEnabled()`: host creates a session +
  seats, others **join by code**; recording a hand inserts a `game_rounds` row
  and updates `session_players.score` in a transaction (an RPC keeps it atomic).
- Subscribe to the session's `game_rounds` + `session_players` via Supabase
  **realtime** so every phone updates instantly; the local scorepad stays the
  offline fallback / single-device mode.
- Finished sessions still snapshot into the existing per-user history
  (`recordResult`) so the profile "games scored / won" stats keep working, and
  cloud history becomes a Pro perk (mirrors the local gating in
  `monetization.md`).

**Entry points already in place:** the friend-pick UI and avatars on the
scoreboard; only the transport (local vs. session) changes.

## Privacy & store requirements (gating launch)

- Update the Privacy Policy “practices” to match (accounts, cloud storage,
  third parties) — the policy already anticipates this.
- Keep in-app **account deletion** + **data export** (already built; extend to
  call the server).
- Add **report/block** before enabling public user-generated content.
- Complete the App Store privacy “nutrition label” / Play Data Safety honestly.

## Safety notes

- No user data is transmitted anywhere until the env vars are set **and** the
  cloud code paths are switched on.
- `service_role` keys must **never** be exposed to the client — only the anon
  key is used in the app; RLS enforces access.
