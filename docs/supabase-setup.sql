-- Club Mahj — full Supabase schema setup.
-- Paste this whole file into the Supabase SQL editor and Run.
-- Idempotent: safe to re-run; already-applied parts are skipped.
-- (Generated from supabase/migrations/0001..0006.)

-- ============================================================
-- 0001_init.sql
-- ============================================================
-- Mahjong Tracker — initial schema (Supabase / Postgres)
-- Run via `supabase db push` or paste into the SQL editor. Review RLS policies
-- with your team before going live. Photos are stored in Supabase Storage and
-- referenced here by URL.

-- ---------------------------------------------------------------------------
-- Helper: keep updated_at current
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ===========================================================================
-- Profiles (1:1 with auth.users)
-- ===========================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null,
  handle      text unique,
  bio         text default '',
  avatar      jsonb not null default '{"face":"letter","char":"Y","color":"#0EAD96"}',
  experience  text not null default 'beginner'
              check (experience in ('beginner','intermediate','expert')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Create a profile row automatically when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, handle)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
          coalesce(new.raw_user_meta_data->>'handle', split_part(new.email,'@',1)));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- Friendships
-- ===========================================================================
create table if not exists public.friendships (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  friend_id  uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'accepted' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);

-- ===========================================================================
-- Tables (private groups) + membership
-- ===========================================================================
create table if not exists public.tables (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        jsonb not null default '{"face":"crack","color":"#D23B4E"}',
  invite_code text unique not null,
  created_by  uuid not null references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.table_members (
  table_id  uuid not null references public.tables(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (table_id, user_id)
);

-- SECURITY DEFINER membership check (avoids recursive RLS).
create or replace function public.is_table_member(p_table uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.table_members
    where table_id = p_table and user_id = auth.uid()
  );
$$;

-- ===========================================================================
-- Table chat
-- ===========================================================================
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  table_id   uuid not null references public.tables(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- Table date polls
-- ===========================================================================
create table if not exists public.poll_options (
  id         uuid primary key default gen_random_uuid(),
  table_id   uuid not null references public.tables(id) on delete cascade,
  play_date  date not null,
  play_time  time,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  primary key (option_id, user_id)
);

-- ===========================================================================
-- Table photo wall
-- ===========================================================================
create table if not exists public.table_photos (
  id         uuid primary key default gen_random_uuid(),
  table_id   uuid not null references public.tables(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  photo_url  text not null,
  caption    text default '',
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- Public feed: posts, likes, comments
-- ===========================================================================
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  hand_label text,
  note       text default '',
  photo_url  text,
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

-- ===========================================================================
-- Gameplay: per-user progress, wins journal, custom card
-- ===========================================================================
create table if not exists public.hand_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  hand_id text not null,
  count   int  not null default 0 check (count >= 0),
  primary key (user_id, hand_id)
);

create table if not exists public.wins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  hand_id    text,
  hand_label text,
  note       text default '',
  photo_url  text,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_cards (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  year       int not null,
  hands      jsonb not null default '[]',
  updated_at timestamptz not null default now()
);
drop trigger if exists custom_cards_touch on public.custom_cards;
create trigger custom_cards_touch before update on public.custom_cards
  for each row execute function public.touch_updated_at();

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.profiles      enable row level security;
alter table public.friendships   enable row level security;
alter table public.tables        enable row level security;
alter table public.table_members enable row level security;
alter table public.messages      enable row level security;
alter table public.poll_options  enable row level security;
alter table public.poll_votes    enable row level security;
alter table public.table_photos  enable row level security;
alter table public.posts         enable row level security;
alter table public.post_likes    enable row level security;
alter table public.comments      enable row level security;
alter table public.hand_progress enable row level security;
alter table public.wins          enable row level security;
alter table public.custom_cards  enable row level security;

-- Profiles: anyone authenticated can read (to find friends); you manage your own.
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_upsert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid());

-- Friendships: see + manage rows that involve you.
create policy friends_read on public.friendships for select to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid());
create policy friends_write on public.friendships for insert to authenticated with check (user_id = auth.uid());
create policy friends_delete on public.friendships for delete to authenticated using (user_id = auth.uid());

-- Tables + membership: members can read; creator inserts; you join/leave yourself.
create policy tables_read on public.tables for select to authenticated using (public.is_table_member(id));
create policy tables_insert on public.tables for insert to authenticated with check (created_by = auth.uid());
create policy members_read on public.table_members for select to authenticated using (public.is_table_member(table_id));
create policy members_self on public.table_members for insert to authenticated with check (user_id = auth.uid());
create policy members_leave on public.table_members for delete to authenticated using (user_id = auth.uid());

-- Table content: readable + writable by members.
create policy msg_read on public.messages for select to authenticated using (public.is_table_member(table_id));
create policy msg_write on public.messages for insert to authenticated with check (public.is_table_member(table_id) and user_id = auth.uid());
create policy popt_read on public.poll_options for select to authenticated using (public.is_table_member(table_id));
create policy popt_write on public.poll_options for insert to authenticated with check (public.is_table_member(table_id));
create policy pvote_read on public.poll_votes for select to authenticated
  using (exists (select 1 from public.poll_options o where o.id = option_id and public.is_table_member(o.table_id)));
create policy pvote_write on public.poll_votes for insert to authenticated with check (user_id = auth.uid());
create policy pvote_delete on public.poll_votes for delete to authenticated using (user_id = auth.uid());
create policy tphoto_read on public.table_photos for select to authenticated using (public.is_table_member(table_id));
create policy tphoto_write on public.table_photos for insert to authenticated with check (public.is_table_member(table_id) and user_id = auth.uid());

-- Feed: posts/likes/comments readable by all authenticated; you write your own.
create policy posts_read on public.posts for select to authenticated using (true);
create policy posts_write on public.posts for insert to authenticated with check (user_id = auth.uid());
create policy posts_delete on public.posts for delete to authenticated using (user_id = auth.uid());
create policy likes_read on public.post_likes for select to authenticated using (true);
create policy likes_write on public.post_likes for insert to authenticated with check (user_id = auth.uid());
create policy likes_delete on public.post_likes for delete to authenticated using (user_id = auth.uid());
create policy comments_read on public.comments for select to authenticated using (true);
create policy comments_write on public.comments for insert to authenticated with check (user_id = auth.uid());
create policy comments_delete on public.comments for delete to authenticated using (user_id = auth.uid());

-- Gameplay: strictly your own rows.
create policy progress_all on public.hand_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy wins_all on public.wins for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cards_all on public.custom_cards for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ============================================================
-- 0002_photos_storage.sql
-- ============================================================
-- Storage RLS for the public "photos" bucket.
--
-- The bucket is public-READ (anyone can view an image by URL — that's how the
-- feed/wins render cross-device). Writes, however, must be locked down: a
-- signed-in user may only upload/modify/delete objects under their OWN folder,
-- i.e. a path that starts with their user id ("<uid>/wins/<uuid>.jpg", matching
-- app/lib/cloudStorage.ts). Re-runnable: each policy is dropped first.
--
-- Run this in the Supabase SQL editor (or `supabase db push`).

drop policy if exists "photos insert own" on storage.objects;
create policy "photos insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "photos update own" on storage.objects;
create policy "photos update own" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "photos delete own" on storage.objects;
create policy "photos delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);


-- ============================================================
-- 0003_feed_moderation.sql
-- ============================================================
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


-- ============================================================
-- 0004_friends_feed.sql
-- ============================================================
-- Friends-only feed: a signed-in user sees their OWN posts plus posts from
-- people they've added as accepted friends. Replaces the public posts_read
-- policy from 0001. Re-runnable.
--
-- is_following() is SECURITY DEFINER so the policy can check friendships without
-- being subject to that table's own RLS (the standard Supabase pattern).

create or replace function public.is_following(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships f
    where f.user_id = auth.uid()
      and f.friend_id = target
      and f.status = 'accepted'
  );
$$;

drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select to authenticated using (
  user_id = auth.uid() or public.is_following(user_id)
);


-- ============================================================
-- 0005_friend_requests.sql
-- ============================================================
-- Friend requests: mutual friendship gated by acceptance.
--
-- A request is a friendships row with status 'pending' (user_id = requester,
-- friend_id = recipient). The recipient accepts by setting status 'accepted';
-- either party can remove the row (decline / cancel / unfriend). Once accepted,
-- the friendship is MUTUAL — feed visibility counts an accepted row in either
-- direction. Re-runnable.

-- Feed visibility: accepted friendship in either direction (mutual).
create or replace function public.is_following(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.user_id = auth.uid() and f.friend_id = target)
        or (f.user_id = target and f.friend_id = auth.uid())
      )
  );
$$;

-- New requests default to pending (was 'accepted').
alter table public.friendships alter column status set default 'pending';

-- Recipient can accept (set their incoming request to accepted).
drop policy if exists friends_accept on public.friendships;
create policy friends_accept on public.friendships for update to authenticated
  using (friend_id = auth.uid())
  with check (friend_id = auth.uid());

-- Either party can remove the row (decline / cancel / unfriend).
drop policy if exists friends_delete on public.friendships;
create policy friends_delete on public.friendships for delete to authenticated
  using (user_id = auth.uid() or friend_id = auth.uid());


-- ============================================================
-- 0006_friends_graph.sql
-- ============================================================
-- Friends graph features: presence (last-seen heartbeat), mutual-friend counts,
-- and suggested players (friends-of-friends + shared-table proxy). Re-runnable.
--
-- Notes:
--  * Presence v1 is a heartbeat column (touch_presence). The client treats a
--    friend as "online" when last_seen_at is within a short TTL, and renders a
--    relative "last seen" otherwise. Realtime Presence can layer on later for
--    instant dots without changing this schema.
--  * "Played N games together" is proxied by shared table membership until
--    scored multiplayer games are persisted server-side (no games table yet).
--  * Contact-match suggestions need on-device-hashed identifiers; left as a
--    follow-up (add profiles.phone_hash / email_hash + a match RPC).

-- ===========================================================================
-- Presence (heartbeat)
-- ===========================================================================
alter table public.profiles add column if not exists last_seen_at timestamptz;
create index if not exists profiles_last_seen_idx on public.profiles (last_seen_at);

-- Called by the client on app-foreground and on a throttled interval.
create or replace function public.touch_presence()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

-- ===========================================================================
-- Friend graph indexes
-- ===========================================================================
create index if not exists friendships_user_status_idx on public.friendships (user_id, status);
create index if not exists friendships_friend_status_idx on public.friendships (friend_id, status);
create index if not exists table_members_user_idx on public.table_members (user_id);

-- The set of a user's accepted friends (ids), regardless of row direction.
create or replace function public.accepted_friend_ids(target uuid)
returns table (fid uuid)
language sql
stable
security definer
set search_path = public
as $$
  select case when f.user_id = target then f.friend_id else f.user_id end
  from public.friendships f
  where f.status = 'accepted' and (f.user_id = target or f.friend_id = target);
$$;

-- Count of friends shared by two users.
create or replace function public.mutual_count(a uuid, b uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.accepted_friend_ids(a) fa
  join public.accepted_friend_ids(b) fb using (fid)
  where fa.fid <> a and fa.fid <> b;
$$;

-- Shared-table count (proxy for "games together" until games are persisted).
create or replace function public.shared_tables(a uuid, b uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.table_members t1
  join public.table_members t2 using (table_id)
  where t1.user_id = a and t2.user_id = b;
$$;

-- ===========================================================================
-- Incoming requests, enriched with the mutual-friend count
-- ===========================================================================
create or replace function public.incoming_requests()
returns table (id uuid, username text, handle text, avatar jsonb, mutual_count int)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.username, p.handle, p.avatar,
         public.mutual_count(auth.uid(), p.id) as mutual_count
  from public.friendships f
  join public.profiles p on p.id = f.user_id
  where f.friend_id = auth.uid() and f.status = 'pending'
  order by mutual_count desc, p.username;
$$;

-- ===========================================================================
-- Suggested players: friends-of-friends ∪ shared-table players,
-- excluding self, existing friends, pending requests (either way), and blocks.
-- Ranked by shared tables, then mutual friends.
-- ===========================================================================
create or replace function public.friend_suggestions(lim int default 12)
returns table (id uuid, username text, handle text, avatar jsonb, mutual_count int, games_together int)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select auth.uid() as u),
  my_friends as (select fid from public.accepted_friend_ids((select u from me))),
  -- friends of my friends
  fof as (
    select case when f.user_id in (select fid from my_friends) then f.friend_id else f.user_id end as cand
    from public.friendships f
    where f.status = 'accepted'
      and (f.user_id in (select fid from my_friends) or f.friend_id in (select fid from my_friends))
  ),
  -- people I share a table with
  table_mates as (
    select t2.user_id as cand
    from public.table_members t1
    join public.table_members t2 using (table_id)
    where t1.user_id = (select u from me) and t2.user_id <> (select u from me)
  ),
  candidates as (
    select cand from fof
    union
    select cand from table_mates
  ),
  filtered as (
    select distinct c.cand
    from candidates c
    where c.cand <> (select u from me)
      and c.cand not in (select fid from my_friends)
      and c.cand not in (
        select friend_id from public.friendships where user_id = (select u from me) and status = 'pending'
        union
        select user_id from public.friendships where friend_id = (select u from me) and status = 'pending'
      )
      and c.cand not in (
        select blocked_id from public.blocks where blocker_id = (select u from me)
        union
        select blocker_id from public.blocks where blocked_id = (select u from me)
      )
  )
  select p.id, p.username, p.handle, p.avatar,
         public.mutual_count((select u from me), p.id) as mutual_count,
         public.shared_tables((select u from me), p.id) as games_together
  from filtered fl
  join public.profiles p on p.id = fl.cand
  order by games_together desc, mutual_count desc, p.username
  limit lim;
$$;

-- Allow authenticated clients to call the RPCs.
grant execute on function public.touch_presence() to authenticated;
grant execute on function public.mutual_count(uuid, uuid) to authenticated;
grant execute on function public.shared_tables(uuid, uuid) to authenticated;
grant execute on function public.accepted_friend_ids(uuid) to authenticated;
grant execute on function public.incoming_requests() to authenticated;
grant execute on function public.friend_suggestions(int) to authenticated;


