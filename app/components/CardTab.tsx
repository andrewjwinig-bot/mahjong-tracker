'use client';

import { useMemo, useState } from 'react';
import type { MahjongCard, Hand } from '../lib/types';
import { colorNotation } from '../lib/theme';
import { useConfetti } from './Confetti';
import TileStrip from './TileStrip';

type Filter = 'all' | 'remaining' | 'won';

interface Props {
  card: MahjongCard;
  handCounts: Record<string, number>;
  onBump: (handId: string, delta: number) => void;
}

export default function CardTab({ card, handCounts, onBump }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const fireConfetti = useConfetti();

  const countOf = (h: Hand) => handCounts[h.id] ?? 0;

  const stats = useMemo(() => {
    let cleared = 0;
    let totalWins = 0;
    let totalPoints = 0;
    for (const h of card.hands) {
      const c = handCounts[h.id] ?? 0;
      if (c > 0) cleared += 1;
      totalWins += c;
      totalPoints += c * h.points;
    }
    return { cleared, totalWins, totalPoints };
  }, [card, handCounts]);

  const visible = (h: Hand) => {
    const c = countOf(h);
    if (filter === 'won') return c > 0;
    if (filter === 'remaining') return c === 0;
    return true;
  };

  const pct = Math.round((stats.cleared / card.hands.length) * 100);

  function gotIt(h: Hand, e: React.MouseEvent<HTMLButtonElement>) {
    const was = countOf(h);
    const r = e.currentTarget.getBoundingClientRect();
    onBump(h.id, +1);
    // First clear of this hand → celebrate with a MAHJ tile burst.
    if (was === 0) fireConfetti({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }

  return (
    <div className="screen">
      <header className="app-header">
        <h1>
          Your {card.year}
          <br />
          Card
        </h1>
        <p className="sub">Tap a tile each time you call MAHJ — clear all {card.hands.length}!</p>
        <TileStrip count={7} />
      </header>

      <div className="stats" style={{ marginTop: 16 }}>
        <div className="stat">
          <div className="num">
            {stats.cleared}
            <span style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 800 }}>
              /{card.hands.length}
            </span>
          </div>
          <div className="lab">Cleared</div>
        </div>
        <div className="stat">
          <div className="num">{stats.totalWins}</div>
          <div className="lab">Mahjs</div>
        </div>
        <div className="stat">
          <div className="num">{stats.totalPoints}</div>
          <div className="lab">Points</div>
        </div>
      </div>

      <div className="progress" aria-label={`${pct}% of card cleared`}>
        <span style={{ width: `${pct}%` }} />
      </div>

      <div className="segmented" style={{ marginTop: 16 }}>
        {(['all', 'remaining', 'won'] as Filter[]).map((f) => (
          <button key={f} data-active={filter === f} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'remaining' ? 'To Go' : 'Got It'}
          </button>
        ))}
      </div>

      {card.categories.map((category) => {
        const hands = card.hands.filter((h) => h.category === category && visible(h));
        if (hands.length === 0) return null;
        const wonInCat = card.hands.filter((h) => h.category === category && countOf(h) > 0).length;
        const totalInCat = card.hands.filter((h) => h.category === category).length;
        return (
          <section key={category}>
            <div className="cat-head">
              <span className="pill">{category}</span>
              <span className="count">
                {wonInCat}/{totalInCat} got
              </span>
            </div>
            {hands.map((h) => {
              const count = countOf(h);
              return (
                <div key={h.id} className={`hand${count > 0 ? ' won' : ''}`}>
                  <button
                    className="check"
                    data-checked={count > 0}
                    onClick={(e) => gotIt(h, e)}
                    aria-label={`Mark "${h.notation}" as won`}
                  >
                    {count > 0 ? '✓' : ''}
                    {count > 1 && <span className="count-badge">{count}</span>}
                  </button>

                  <div className="notation">
                    {colorNotation(h.notation).map((g, i) => (
                      <span key={i} style={{ color: g.color }}>
                        {g.text}
                        {i < colorNotation(h.notation).length - 1 ? ' ' : ''}
                      </span>
                    ))}
                  </div>

                  {count > 0 && (
                    <button
                      className="minus"
                      onClick={() => onBump(h.id, -1)}
                      aria-label="Remove a win"
                    >
                      −
                    </button>
                  )}

                  <span className="pts">
                    {h.concealed ? `C${h.points}` : `×${h.points}`}
                  </span>
                </div>
              );
            })}
          </section>
        );
      })}

      <p
        style={{
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: 12,
          fontWeight: 700,
          marginTop: 28,
        }}
      >
        Sample card — illustrative notations, not the official NMJL card.
      </p>
    </div>
  );
}
