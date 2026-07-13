'use client';

import { useSyncExternalStore } from 'react';
import { isPro, subscribePro, FREE_LAUNCH } from './pro';

/** Reactive Pro entitlement — re-renders consumers the moment it flips. */
export function usePro(): boolean {
  return useSyncExternalStore(
    subscribePro,
    () => isPro(),
    // Server snapshot: match the client under free-launch so upsells don't flash
    // in during hydration; otherwise the pre-render assumes not-Pro as before.
    () => FREE_LAUNCH,
  );
}
