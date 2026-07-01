// Earnable trophies, derived from the player's progress. Pure functions over
// the card + counts so the trophy shelf and any future notifications agree.

import type { MahjongCard } from './types';
import { CHALLENGES, challengeProgress } from './challenges';
import { LESSONS, loadCompleted } from './lessons';

export interface Stats {
  cleared: number;
  total: number;
  mahjs: number;
  points: number;
  categoriesCleared: number;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  earned: boolean;
}

const K_SEEN = 'mahj.badges';

export function loadSeenBadges(): string[] {
  try {
    const raw = localStorage.getItem(K_SEEN);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveSeenBadges(ids: string[]): void {
  try {
    localStorage.setItem(K_SEEN, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function computeStats(card: MahjongCard, handCounts: Record<string, number>): Stats {
  let cleared = 0;
  let mahjs = 0;
  let points = 0;
  for (const h of card.hands) {
    const c = handCounts[h.id] ?? 0;
    if (c > 0) cleared += 1;
    mahjs += c;
    points += c * h.points;
  }
  const categoriesCleared = card.categories.filter((cat) =>
    card.hands.filter((h) => h.category === cat).every((h) => (handCounts[h.id] ?? 0) > 0),
  ).length;
  return { cleared, total: card.hands.length, mahjs, points, categoriesCleared };
}

export function computeBadges(
  card: MahjongCard,
  handCounts: Record<string, number>,
  bestStreak: number,
): Badge[] {
  const s = computeStats(card, handCounts);
  const seasonDone = (id: string) => {
    const ch = CHALLENGES.find((c) => c.id === id);
    if (!ch) return false;
    const p = challengeProgress(ch, card, handCounts);
    return p.total > 0 && p.done >= p.total;
  };

  const list: { id: string; name: string; emoji: string; desc: string; cond: boolean }[] = [
    { id: 'first', name: 'First Mahj', emoji: '🀄', desc: 'Log your first MAHJ.', cond: s.mahjs >= 1 },
    { id: 'ten', name: 'On a Roll', emoji: '🎯', desc: 'Win 10 mahjs.', cond: s.mahjs >= 10 },
    { id: 'fifty', name: 'High Roller', emoji: '💎', desc: 'Win 50 mahjs.', cond: s.mahjs >= 50 },
    { id: 'pts500', name: 'Point Hunter', emoji: '⭐', desc: 'Bank 500 points.', cond: s.points >= 500 },
    { id: 'pts1000', name: 'Point Shark', emoji: '🦈', desc: 'Bank 1,000 points.', cond: s.points >= 1000 },
    { id: 'cat1', name: 'Category Clear', emoji: '🏅', desc: 'Clear a full category.', cond: s.categoriesCleared >= 1 },
    { id: 'cat5', name: 'Category Master', emoji: '🎖️', desc: 'Clear 5 categories.', cond: s.categoriesCleared >= 5 },
    { id: 'card', name: 'Card Cleared', emoji: '👑', desc: 'Clear every hand on the card.', cond: s.cleared >= s.total },
    { id: 'scholar', name: 'Mahjong Scholar', emoji: '🎓', desc: 'Finish every lesson in Learn.', cond: loadCompleted().length >= LESSONS.length },
    { id: 'streak3', name: 'Warmed Up', emoji: '🔥', desc: '3-day streak.', cond: bestStreak >= 3 },
    { id: 'streak7', name: 'Dedicated', emoji: '🔥', desc: '7-day streak.', cond: bestStreak >= 7 },
    { id: 'streak30', name: 'Obsessed', emoji: '🔥', desc: '30-day streak.', cond: bestStreak >= 30 },
    { id: 's_newyear', name: 'New Year, New Card', emoji: '🎆', desc: 'Finish the Winter season.', cond: seasonDone('newyear') },
    { id: 's_spring', name: 'Spring Bloom', emoji: '🌸', desc: 'Finish the Spring season.', cond: seasonDone('spring') },
    { id: 's_summer', name: 'Summer Breeze', emoji: '☀️', desc: 'Finish the Summer season.', cond: seasonDone('summer') },
    { id: 's_autumn', name: 'Autumn Dragons', emoji: '🐉', desc: 'Finish the Autumn season.', cond: seasonDone('autumn') },
    { id: 's_yearsend', name: 'Year’s End', emoji: '🎁', desc: 'Finish the Holidays season.', cond: seasonDone('yearsend') },
  ];

  return list.map(({ cond, ...b }) => ({ ...b, earned: cond }));
}
