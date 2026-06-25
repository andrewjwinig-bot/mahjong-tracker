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
