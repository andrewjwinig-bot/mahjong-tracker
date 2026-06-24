'use client';

import { useEffect, useMemo, useState } from 'react';
import { dailyPool, tipOfTheDayIndex } from '../lib/tips';
import type { Experience } from '../lib/account';

const DISMISS_KEY = 'mahj.tipDismissed';
const todayKey = () => new Date().toDateString();

export default function TipCard({ experience }: { experience: Experience }) {
  const pool = useMemo(() => dailyPool(experience), [experience]);
  const entry = pool[tipOfTheDayIndex(pool.length) % pool.length];
  const label = entry.kind === 'fact' ? 'DID YOU KNOW?' : 'TIP OF THE DAY';
  // Dismissed for *today* only — a daily tip should come back tomorrow.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === todayKey()) setDismissed(true);
    } catch {
      /* ignore */
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, todayKey());
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (dismissed) return null;

  // The whole card is tappable to dismiss; the × is just an affordance.
  return (
    <button className="tip-card" onClick={dismiss} aria-label="Dismiss today’s tip">
      <span className="tip-tile" aria-hidden>
        {entry.kind === 'fact' ? '🀄' : '★'}
      </span>
      <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <span className="tip-label">{label}</span>
        <span className="tip-text">{entry.text}</span>
      </span>
      <span className="tip-dismiss" aria-hidden>
        ×
      </span>
    </button>
  );
}
