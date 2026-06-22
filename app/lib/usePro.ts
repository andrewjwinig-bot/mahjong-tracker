'use client';

import { useSyncExternalStore } from 'react';
import { isPro, subscribePro } from './pro';

/** Reactive Pro entitlement — re-renders consumers the moment it flips. */
export function usePro(): boolean {
  return useSyncExternalStore(
    subscribePro,
    () => isPro(),
    () => false,
  );
}
