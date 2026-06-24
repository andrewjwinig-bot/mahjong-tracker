'use client';

import { useEffect, useMemo, useState } from 'react';
import { tipsFor, tipOfTheDayIndex } from '../lib/tips';
import type { Experience } from '../lib/account';

const DISMISS_KEY = 'mahj.tipDismissed';
const todayKey = () => new Date().toDateString();

export default function TipCard({ experience }: { experience: Experience }) {
  const tips = useMemo(() => tipsFor(experience), [experience]);
  const tip = tips[tipOfTheDayIndex(tips.length) % tips.length];
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
        ★
      </span>
      <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <span className="tip-label">TIP OF THE DAY</span>
        <span className="tip-text">{tip}</span>
      </span>
      <span className="tip-dismiss" aria-hidden>
        ×
      </span>
    </button>
  );
}
