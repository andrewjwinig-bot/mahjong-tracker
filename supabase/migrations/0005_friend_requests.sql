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
