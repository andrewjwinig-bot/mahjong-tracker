'use client';

import { useMemo, useState } from 'react';
import type { MahjongCard, Hand, Win } from '../lib/types';
import { colorNotation } from '../lib/theme';
import { buildShareCard } from '../lib/shareCard';
import { captionFor, appUrl } from '../lib/share';
import { useConfetti } from './Confetti';
import TileStrip from './TileStrip';
import TipCard from './TipCard';
import ShareModal from './ShareModal';
import { ChallengeCard, SeasonsSheet } from './Challenges';
import { activeChallenge, challengeProgress } from '../lib/challenges';

type Filter = 'all' | 'remaining' | 'won' | 'challenge';

interface Props {
  card: MahjongCard;
  handCounts: Record<string, number>;
  onBump: (handId: string, delta: number) => void;
  /** First-time clear of a hand: posts to the feed, returns the Win to share. */
  onMahj: (hand: Hand) => Win;
}

export default function CardTab({ card, handCounts, onBump, onMahj }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [shareWin, setShareWin] = useState<Win | null>(null);
  const [seasonsOpen, setSeasonsOpen] = useState(false);
  const { celebrate } = useConfetti();

  const challenge = useMemo(() => activeChallenge(), []);
  const chProg = useMemo(
    () => challengeProgress(challenge, card, handCounts),
    [challenge, card, handCounts],
  );

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
    if (filter === 'challenge') return challenge.match(h);
    return true;
  };

  const pct = Math.round((stats.cleared / card.hands.length) * 100);

  function gotIt(h: Hand) {
    const was = countOf(h);
    if (was !== 0) {
      onBump(h.id, +1);
      return;
    }
    // First clear → post to feed + full-screen celebration with a share prompt.
    const win = onMahj(h);
    const total = card.hands.length;
    const newCleared = stats.cleared + 1;

    // Did this clear finish the whole category, or the entire card?
    const catHands = card.hands.filter((x) => x.category === h.category);
    const catDone = catHands.every((x) => x.id === h.id || countOf(x) > 0);
    const cardDone = newCleared >= total;

    if (cardDone) {
      celebrate({
        title: 'You Cleared The Card!!',
        emoji: '👑',
        hype: 'ALL 70 HANDS — LEGENDARY 👑',
        cleared: newCleared,
        total,
        posted: true,
        big: true,
        onShare: () => setShareWin(win),
      });
    } else if (catDone) {
      celebrate({
        title: 'Category Cleared! 🎉',
        emoji: '🏆',
        hype: `Every ${h.category} hand — done!`,
        handLabel: h.notation,
        points: h.points,
        cleared: newCleared,
        total,
        posted: true,
        big: true,
        onShare: () => setShareWin(win),
      });
    } else {
      celebrate({
        title: 'I Got Mahj! 🎉',
        handLabel: h.notation,
        points: h.points,
        cleared: newCleared,
        total,
        posted: true,
        onShare: () => setShareWin(win),
      });
    }
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

      <div style={{ marginTop: 16 }}>
        <ChallengeCard
          challenge={challenge}
          done={chProg.done}
          total={chProg.total}
          focused={filter === 'challenge'}
          onToggleFocus={() => setFilter((f) => (f === 'challenge' ? 'all' : 'challenge'))}
          onSeasons={() => setSeasonsOpen(true)}
        />
      </div>

      <div style={{ marginTop: 14 }}>
        <TipCard />
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
            <div className="cat-bar">
              <span className="cat-name">{category}</span>
              <span className="cat-count">
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
                    onClick={() => gotIt(h)}
                    aria-label={`Mark "${h.notation}" as won`}
                  >
                    {count > 0 ? '✓' : ''}
                    {count > 1 && <span className="count-badge">{count}</span>}
                  </button>

                  <div className="notation">
                    {colorNotation(h.notation).map((g, i, arr) => (
                      <span key={i} className={g.cls}>
                        {g.text}
                        {i < arr.length - 1 ? ' ' : ''}
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

                  {challenge.match(h) && (
                    <span className="ch-row-tag" title={`${challenge.season} Challenge`}>
                      {challenge.emoji}
                    </span>
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

      {shareWin && (
        <ShareModal
          payload={{
            title: 'Share Your Mahj! 🀄',
            text: captionFor(shareWin),
            url: appUrl(),
            image: () => buildShareCard(shareWin, shareWin.handLabel),
          }}
          onClose={() => setShareWin(null)}
        />
      )}

      {seasonsOpen && (
        <SeasonsSheet card={card} handCounts={handCounts} onClose={() => setSeasonsOpen(false)} />
      )}
    </div>
  );
}
