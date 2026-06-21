'use client';

import type { MahjongCard } from '../lib/types';
import { computeStats, computeBadges } from '../lib/badges';

export default function TrophyShelf({
  card,
  handCounts,
  bestStreak,
  memberSince,
  onClose,
}: {
  card: MahjongCard;
  handCounts: Record<string, number>;
  bestStreak: number;
  memberSince?: number;
  onClose: () => void;
}) {
  const s = computeStats(card, handCounts);
  const badges = computeBadges(card, handCounts, bestStreak);
  const earned = badges.filter((b) => b.earned).length;

  const since = memberSince
    ? new Date(memberSince).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : '—';

  const stats: { label: string; value: string }[] = [
    { label: 'Cleared', value: `${s.cleared}/${s.total}` },
    { label: 'Mahjs', value: `${s.mahjs}` },
    { label: 'Points', value: `${s.points}` },
    { label: 'Best streak', value: `${bestStreak}d` },
  ];

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h2>Trophies 🏆</h2>
        <p className="sheet-sub">
          {earned}/{badges.length} earned · since {since}
        </p>

        <div className="stat-row">
          {stats.map((st) => (
            <div className="stat-mini" key={st.label}>
              <div className="sm-num">{st.value}</div>
              <div className="sm-lab">{st.label}</div>
            </div>
          ))}
        </div>

        <div className="trophy-grid">
          {badges.map((b) => (
            <div className="trophy" data-earned={b.earned} key={b.id} title={b.desc}>
              <span className="trophy-emoji">{b.earned ? b.emoji : '🔒'}</span>
              <span className="trophy-name">{b.name}</span>
              <span className="trophy-desc">{b.desc}</span>
            </div>
          ))}
        </div>

        <button className="btn ghost" style={{ marginTop: 16 }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
