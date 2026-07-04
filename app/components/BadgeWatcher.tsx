'use client';

import { useEffect, useRef, useState } from 'react';
import type { MahjongCard } from '../lib/types';
import { computeBadges, loadSeenBadges, saveSeenBadges, type Badge } from '../lib/badges';
import {
  computeXp,
  gameWinPoints,
  levelForXp,
  loadSeenLevel,
  saveSeenLevel,
  rankForLevel,
} from '../lib/levels';
import { playTrophy } from '../lib/sound';

type Pop =
  | { kind: 'badge'; emoji: string; title: string; name: string }
  | { kind: 'level'; emoji: string; title: string; name: string };

/** Watches progress and pops a toast whenever a new trophy is earned or the
 *  player reaches a new level. */
export default function BadgeWatcher({
  card,
  handCounts,
  bestStreak,
  profileName,
}: {
  card: MahjongCard;
  handCounts: Record<string, number>;
  bestStreak: number;
  profileName?: string;
}) {
  const [toast, setToast] = useState<Pop | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const seenLevel = useRef<number | null>(null);

  useEffect(() => {
    const gameXp = gameWinPoints(profileName);
    const badges = computeBadges(card, handCounts, bestStreak, gameXp);
    const earned = badges.filter((b) => b.earned);
    const ids = earned.map((b) => b.id);

    const xp = computeXp({ card, handCounts, profileName, trophiesEarned: earned.length });
    const level = levelForXp(xp.total);

    // First pass: adopt whatever is already earned/reached without celebrating.
    if (seen.current === null) {
      const stored = loadSeenBadges();
      seen.current = new Set(stored.length ? stored : ids);
      saveSeenBadges([...seen.current]);
      const storedLevel = loadSeenLevel();
      seenLevel.current = storedLevel ?? level;
      saveSeenLevel(seenLevel.current);
      return;
    }

    const fresh = earned.filter((b) => !seen.current!.has(b.id));
    if (fresh.length) {
      fresh.forEach((b) => seen.current!.add(b.id));
      saveSeenBadges([...seen.current]);
    }

    const leveledUp = seenLevel.current !== null && level > seenLevel.current;
    if (level !== seenLevel.current) {
      seenLevel.current = level;
      saveSeenLevel(level);
    }

    // A level-up is the bigger moment, so it wins if both land at once; the new
    // trophy still persists as earned and shows in the shelf.
    if (leveledUp) {
      const rank = rankForLevel(level);
      setToast({ kind: 'level', emoji: rank.emoji, title: 'Level Up!', name: `Level ${level} · ${rank.name}` });
      playTrophy();
    } else if (fresh.length) {
      setToast({ kind: 'badge', emoji: fresh[0].emoji, title: 'Trophy Unlocked!', name: fresh[0].name });
      playTrophy();
    }
  }, [card, handCounts, bestStreak, profileName]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  return (
    <button className="badge-toast" data-kind={toast.kind} onClick={() => setToast(null)}>
      <span className="bt-emoji">{toast.emoji}</span>
      <span style={{ textAlign: 'left' }}>
        <span className="bt-title">{toast.title}</span>
        <span className="bt-name">{toast.name}</span>
      </span>
    </button>
  );
}
