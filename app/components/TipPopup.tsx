'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { dailyPool, tipOfTheDayIndex } from '../lib/tips';
import { useSwipeDismiss } from '../lib/useSwipeDismiss';
import type { Experience } from '../lib/account';

const DISMISS_KEY = 'mahj.tipDismissed';
const todayKey = () => new Date().toDateString();

// The daily tip as a once-a-day moment: it slides up from the bottom the first
// time the app is opened each day, then gets out of the way. Non-blocking (the
// feed is usable underneath), auto-dismisses if untouched, and never lives as
// permanent chrome on the Feed.
export default function TipPopup({ experience }: { experience: Experience }) {
  const pool = useMemo(() => dailyPool(experience), [experience]);
  const entry = pool[tipOfTheDayIndex(pool.length) % pool.length];
  const label = entry.kind === 'fact' ? 'DID YOU KNOW?' : 'TIP OF THE DAY';

  // `show` mounts the popup; `exiting` plays the slide-down before unmount.
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function dismiss() {
    if (timer.current) clearTimeout(timer.current);
    setExiting(true);
    setTimeout(() => setShow(false), 260);
  }

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(DISMISS_KEY) === todayKey();
    } catch {
      /* ignore */
    }
    if (seen) return;
    // Mark seen for today up front, so a tab switch / warm resume won't bring it
    // back even if the user never taps it.
    try {
      localStorage.setItem(DISMISS_KEY, todayKey());
    } catch {
      /* ignore */
    }
    setShow(true);
    timer.current = setTimeout(dismiss, 8000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const swipe = useSwipeDismiss(dismiss);

  if (!show) return null;

  return (
    <div className="tip-popup-wrap" role="status" aria-live="polite">
      <button
        className="tip-popup"
        data-exiting={exiting}
        onClick={dismiss}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
        aria-label="Dismiss today’s tip"
      >
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
    </div>
  );
}
