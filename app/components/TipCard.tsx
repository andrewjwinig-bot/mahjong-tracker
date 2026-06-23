'use client';

import { useEffect, useMemo, useState } from 'react';
import { tipsFor, tipOfTheDayIndex } from '../lib/tips';
import type { Experience } from '../lib/account';
import { IconShuffle } from './uiIcons';

const DISMISS_KEY = 'mahj.tipDismissed';
const todayKey = () => new Date().toDateString();

export default function TipCard({ experience }: { experience: Experience }) {
  const tips = useMemo(() => tipsFor(experience), [experience]);
  const [i, setI] = useState(() => tipOfTheDayIndex(tips.length));
  const [shuffled, setShuffled] = useState(false);
  // Dismissed for *today* only — a daily fact should come back tomorrow.
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

  return (
    <div className="tip-card">
      <span className="tip-tile" aria-hidden>
        ★
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="tip-label">{shuffled ? 'PRO TIP' : 'TIP OF THE DAY'}</div>
        <div className="tip-text">{tips[i % tips.length]}</div>
      </div>
      <div className="tip-actions">
        <button
          className="tip-shuffle"
          aria-label="Another tip"
          onClick={() => {
            setI((p) => (p + 1) % tips.length);
            setShuffled(true);
          }}
        >
          <IconShuffle size={16} />
        </button>
        <button className="tip-dismiss" aria-label="Dismiss for today" onClick={dismiss}>
          ×
        </button>
      </div>
    </div>
  );
}
