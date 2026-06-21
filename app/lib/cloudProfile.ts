// Cloud profile read/write. Dormant until cloud is configured.

import { getSupabase } from './supabase';
import type { Profile } from './social';

export async function cloudSaveProfile(p: Profile): Promise<void> {
  const sb = await getSupabase();
  if (!sb) return;
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return;
  await sb
    .from('profiles')
    .update({ username: p.name, handle: p.handle, bio: p.bio, avatar: p.avatar })
    .eq('id', u.user.id);
}
