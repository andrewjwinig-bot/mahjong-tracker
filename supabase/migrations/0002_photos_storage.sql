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
