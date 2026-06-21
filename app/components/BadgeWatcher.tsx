'use client';

import { useEffect, useRef, useState } from 'react';
import type { MahjongCard } from '../lib/types';
import { computeBadges, loadSeenBadges, saveSeenBadges, type Badge } from '../lib/badges';
import { playTrophy } from '../lib/sound';

/** Watches progress and pops a toast whenever a new trophy is earned. */
export default function BadgeWatcher({
  card,
  handCounts,
  bestStreak,
}: {
  card: MahjongCard;
  handCounts: Record<string, number>;
  bestStreak: number;
}) {
  const [toast, setToast] = useState<Badge | null>(null);
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    const earned = computeBadges(card, handCounts, bestStreak).filter((b) => b.earned);
    const ids = earned.map((b) => b.id);

    // First pass: adopt whatever is already earned without celebrating.
    if (seen.current === null) {
      const stored = loadSeenBadges();
      seen.current = new Set(stored.length ? stored : ids);
      saveSeenBadges([...seen.current]);
      return;
    }

    const fresh = earned.filter((b) => !seen.current!.has(b.id));
    if (fresh.length) {
      fresh.forEach((b) => seen.current!.add(b.id));
      saveSeenBadges([...seen.current]);
      setToast(fresh[0]); // show the first; others persist as earned
      playTrophy();
    }
  }, [card, handCounts, bestStreak]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  return (
    <button className="badge-toast" onClick={() => setToast(null)}>
      <span className="bt-emoji">{toast.emoji}</span>
      <span style={{ textAlign: 'left' }}>
        <span className="bt-title">Trophy Unlocked!</span>
        <span className="bt-name">{toast.name}</span>
      </span>
    </button>
  );
}
