'use client';

import { useEffect } from 'react';
import { cloudTouchPresence } from '../lib/cloudFriends';

/** Pings last_seen_at on foreground + every 45s so friends' presence dots stay
 *  fresh. A no-op when cloud is off (getSupabase returns null). */
export default function PresenceHeartbeat() {
  useEffect(() => {
    const ping = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') void cloudTouchPresence();
    };
    ping();
    const timer = window.setInterval(ping, 45000);
    document.addEventListener('visibilitychange', ping);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', ping);
    };
  }, []);
  return null;
}
