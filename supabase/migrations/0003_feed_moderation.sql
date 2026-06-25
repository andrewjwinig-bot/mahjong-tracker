-- Feed + moderation: makes the public feed real and adds the report/block
-- safety tools required before user-generated content ships to the App Store.
-- Re-runnable.

-- ---------------------------------------------------------------------------
-- Milestone columns on posts, so celebratory banners (section/card cleared,
-- game won, challenge done) round-trip through the cloud like the app's local
-- FeedPost. 'mahj' posts leave these null.
-- ---------------------------------------------------------------------------
alter table public.posts add column if not exists kind     text;
alter table public.posts add column if not exists title    text;
alter table public.posts add column if not exists eyebrow  text;
alter table public.posts add column if not exists progress text;
alter table public.posts add column if not exists place    text;

-- ---------------------------------------------------------------------------
-- Blocks: a user hides another user. The client filters blocked authors out of
-- the feed. A user only ever sees/manages their own block rows.
-- ---------------------------------------------------------------------------
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
alter table public.blocks enable row level security;

drop policy if exists blocks_own on public.blocks;
create policy blocks_own on public.blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Reports: a user flags a post (or a user) for review. Reporters can file
-- reports; they cannot read anyone's reports (moderation is reviewed via the
-- service role / dashboard).
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid not null references public.profiles(id) on delete cascade,
  post_id          uuid references public.posts(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  reason           text not null default '',
  created_at       timestamptz not null default now()
);
alter table public.reports enable row level security;

drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
