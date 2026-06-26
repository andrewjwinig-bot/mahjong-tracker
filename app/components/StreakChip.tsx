'use client';

import { useEffect, useRef, useState } from 'react';
import { IconFlame } from './uiIcons';

// A compact, always-visible streak chip (Duolingo-style) — glanceable status
// rather than a banner that eats the Feed. Mirrors the gear in the top corner;
// tapping it shows a brief "keep it going" nudge that auto-hides.
export default function StreakChip({ streak }: { streak: number }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  if (streak < 2) return null;

  function show() {
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 2400);
  }

  return (
    <button className="streak-chip" onClick={show} aria-label={`${streak}-day streak`}>
      <span className="sc-flame" aria-hidden>
        <IconFlame size={15} />
      </span>
      <span className="sc-num">{streak}</span>
      {open && <span className="sc-nudge">{streak}-day streak — keep it going!</span>}
    </button>
  );
}
