'use client';

import { useEffect, useRef, useState } from 'react';

// Animates a number counting up to its target — the stat tiles "deal in" their
// value rather than snapping. Respects prefers-reduced-motion and animates from
// the previous value on change so increments feel like a quick roll, not a
// full replay from zero.
export default function CountUp({
  value,
  duration = 650,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const from = fromRef.current;
    const to = value;
    if (reduce || from === to) {
      setDisplay(to);
      fromRef.current = to;
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic for a snappy settle
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      fromRef.current = to;
    };
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}
