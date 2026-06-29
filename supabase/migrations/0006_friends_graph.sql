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
