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
