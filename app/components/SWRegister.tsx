'use client';

import { useEffect } from 'react';

/** Registers the service worker for offline support + home-screen install. */
export default function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return; // avoid caching dev assets

    let reloaded = false;
    // When a new SW takes control (after a cache bump), reload once so the page
    // picks up the fresh CSS/JS instead of the previously cached assets.
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    let registration: ServiceWorkerRegistration | null = null;
    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          registration = reg;
          reg.update();
          // If an updated worker is waiting, activate it immediately.
          if (reg.waiting) reg.waiting.postMessage('skip-waiting');
          reg.addEventListener('updatefound', () => {
            const sw = reg.installing;
            if (!sw) return;
            sw.addEventListener('statechange', () => {
              if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                sw.postMessage('skip-waiting');
              }
            });
          });
        })
        .catch(() => {});
    };
    window.addEventListener('load', onLoad);

    // Re-check for a new deployment whenever the app returns to the foreground —
    // covers installed PWAs that resume without a full reload, where a new
    // version would otherwise go unnoticed for a long time.
    const onVisible = () => {
      if (document.visibilityState === 'visible') registration?.update();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('load', onLoad);
      document.removeEventListener('visibilitychange', onVisible);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);
  return null;
}
