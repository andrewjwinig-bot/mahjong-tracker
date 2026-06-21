// Photo upload to Supabase Storage (bucket: "photos"). Returns a public URL,
// or null when cloud isn't configured / not signed in. Dormant until cloud is on.

import { getSupabase } from './supabase';

export async function uploadPhoto(blob: Blob, prefix = 'wins'): Promise<string | null> {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  const ext = blob.type === 'image/png' ? 'png' : 'jpg';
  const path = `${u.user.id}/${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage
    .from('photos')
    .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false });
  if (error) return null;
  return sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
}
