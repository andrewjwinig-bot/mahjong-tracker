-- Fix: new-account creation fails when a handle is already taken.
--
-- profiles.handle is UNIQUE (0001), but handle_new_user() inserted a handle
-- derived straight from the username / email prefix with no de-duplication.
-- The second person to sign up with a colliding handle (e.g. two "tilequeen"s,
-- or two people whose email local-part matches) hit a unique-constraint
-- violation *inside* the AFTER INSERT trigger on auth.users. That aborts the
-- whole signup transaction, and Supabase Auth returns "Database error saving
-- new user" — the app just shows "it won't let me make a new account."
--
-- This replaces the trigger function with a version that:
--   * normalizes the handle to a safe charset (lowercase a-z0-9_),
--   * falls back to 'player' when nothing usable is provided, and
--   * appends the smallest numeric suffix needed to make the handle unique,
-- so a fresh profile row is always insertable and signup never fails here.
--
-- Idempotent (CREATE OR REPLACE); safe to re-run.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_handle text;
  new_handle  text;
  suffix      int := 1;
begin
  -- Prefer the explicit handle, then username, then the email local-part.
  base_handle := lower(coalesce(
    nullif(new.raw_user_meta_data->>'handle', ''),
    nullif(new.raw_user_meta_data->>'username', ''),
    split_part(new.email, '@', 1),
    ''
  ));

  -- Keep handles to a predictable charset; guarantee a non-empty base.
  base_handle := regexp_replace(base_handle, '[^a-z0-9_]', '', 'g');
  if base_handle = '' then
    base_handle := 'player';
  end if;

  -- Find the first free handle: base, base1, base2, …
  new_handle := base_handle;
  while exists (select 1 from public.profiles where handle = new_handle) loop
    new_handle := base_handle || suffix::text;
    suffix := suffix + 1;
  end loop;

  insert into public.profiles (id, username, handle)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1)),
    new_handle
  );
  return new;
end; $$;
