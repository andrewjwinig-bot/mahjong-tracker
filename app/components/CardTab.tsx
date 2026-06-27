'use client';

import { useMemo, useState } from 'react';
import type { MahjongCard, Hand, Win } from '../lib/types';
import type { FeedPost } from '../lib/social';
import { YOU_ID } from '../lib/social';
import { colorNotation } from '../lib/theme';
import { buildShareCard } from '../lib/shareCard';
import { captionFor, appUrl } from '../lib/share';
import { useConfetti } from './Confetti';
import CardTitle from './CardTitle';
import CountUp from './CountUp';
import Tile from './Tile';
import ShareModal from './ShareModal';
import { LogWinSheet, WinCard } from './WinsTab';
import { ChallengeCard, SeasonsSheet } from './Challenges';
import { activeChallenge, challengeProgress } from '../lib/challenges';
import { computeBadges } from '../lib/badges';
import { IconTrophy } from './uiIcons';
import EmptyCard from './EmptyCard';

type Filter = 'all' | 'remaining' | 'won' | 'challenge';

interface Props {
  card: MahjongCard;
  handCounts: Record<string, number>;
  bestStreak: number;
  handNotes: Record<string, string>;
  wins: Win[];
  feed: FeedPost[];
  groupName: string;
  onBump: (handId: string, delta: number) => void;
  onAddWin: (win: Win) => void;
  onRemoveWin: (id: string) => void;
  onPostToGroup: (win: Win) => void;
  onMilestone: (kind: 'section_cleared' | 'card_cleared' | 'challenge_done', title: string, note?: string) => void;
  onTrophies: () => void;
  /** No card set up yet → show the setup prompt instead of the tracker. */
  needsCard: boolean;
  scanEnabled: boolean;
  onAddCard: () => void;
  onUseSample: () => void;
}

export default function CardTab({
  card,
  handCounts,
  bestStreak,
  handNotes,
  wins,
  feed,
  groupName,
  onBump,
  onAddWin,
  onRemoveWin,
  onPostToGroup,
  onMilestone,
  onTrophies,
  needsCard,
  scanEnabled,
  onAddCard,
  onUseSample,
}: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [shareWin, setShareWin] = useState<Win | null>(null);
  const [seasonsOpen, setSeasonsOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  // The hand a tapped row pre-selects in the Call Mahj sheet (null = blank).
  const [logHandId, setLogHandId] = useState<string | null>(null);
  const { celebrate } = useConfetti();

  function openLog(handId?: string) {
    setLogHandId(handId ?? null);
    setLogOpen(true);
  }

  const challenge = useMemo(() => activeChallenge(), []);
  const chProg = useMemo(
    () => challengeProgress(challenge, card, handCounts),
    [challenge, card, handCounts],
  );

  const countOf = (h: Hand) => handCounts[h.id] ?? 0;

  // Live trophy progress for the Stats & Trophies shortcut.
  const trophies = useMemo(() => {
    const badges = computeBadges(card, handCounts, bestStreak);
    return { earned: badges.filter((b) => b.earned).length, total: badges.length };
  }, [card, handCounts, bestStreak]);

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

  // Every win — whether logged from the hero or by tapping a hand row — flows
  // through the Call Mahj sheet, then here on save: persist, post, and fire the
  // right celebration + milestone posts.
  function handleSaveWin(win: Win, opts: { shareToGroup: boolean }) {
    const h = win.handId ? card.hands.find((x) => x.id === win.handId) ?? null : null;
    const was = win.handId ? handCounts[win.handId] ?? 0 : 0;

    onAddWin(win);
    if (win.handId) onBump(win.handId, +1);
    if (opts.shareToGroup) onPostToGroup(win);
    setLogOpen(false);

    const total = card.hands.length;
    const bonus = h && challenge.match(h) ? `${challenge.emoji} ${challenge.season} season bonus!` : undefined;

    // First clear of a real card hand → milestone detection + big celebration.
    if (h && was === 0) {
      const newCleared = stats.cleared + 1;
      const catHands = card.hands.filter((x) => x.category === h.category);
      const catDone = catHands.every((x) => x.id === h.id || countOf(x) > 0);
      const cardDone = newCleared >= total;

      if (cardDone) onMilestone('card_cleared', 'Cleared the whole card!', 'All 70 hands 👑');
      else if (catDone) onMilestone('section_cleared', `Cleared every ${h.category} hand`);
      if (challenge.match(h) && chProg.done < chProg.total && chProg.done + 1 >= chProg.total) {
        onMilestone('challenge_done', `Finished ${challenge.name}`);
      }

      if (cardDone) {
        celebrate({ title: 'You Cleared The Card!!', emoji: '👑', hype: 'ALL 70 HANDS — LEGENDARY 👑', cleared: newCleared, total, posted: opts.shareToGroup, big: true, bonus, onShare: () => setShareWin(win) });
      } else if (catDone) {
        celebrate({ title: 'Category Cleared! 🎉', emoji: '🏆', hype: `Every ${h.category} hand — done!`, handLabel: win.handLabel ?? h.notation, points: h.points, cleared: newCleared, total, posted: opts.shareToGroup, big: true, bonus, onShare: () => setShareWin(win) });
      } else {
        celebrate({ title: 'I Got Mahj! 🎉', handLabel: win.handLabel ?? h.notation, points: h.points, cleared: newCleared, total, posted: opts.shareToGroup, bonus, onShare: () => setShareWin(win), onPost: opts.shareToGroup ? undefined : () => onPostToGroup(win) });
      }
    } else {
      // Repeat win of a cleared hand, or a Freeform mahj.
      celebrate({ title: 'I Got Mahj! 🎉', handLabel: win.handLabel, points: h?.points, posted: opts.shareToGroup, bonus, onShare: () => setShareWin(win), onPost: opts.shareToGroup ? undefined : () => onPostToGroup(win) });
    }
  }

  if (needsCard) {
    return (
      <div className="screen">
        <header className="app-header card-header">
          <CardTitle />
          <p className="sub">Track every hand on your card.</p>
        </header>
        <EmptyCard scanEnabled={scanEnabled} onAdd={onAddCard} onUseSample={onUseSample} />
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="app-header card-header">
        <CardTitle />
        <p className="sub">Track every hand on this year’s card.</p>
      </header>

      {/* A scanned card reads as confident and done for the year; the sample
          keeps a prominent "bring in your own" call-to-action. Both tap to edit. */}
      {card.source === 'custom' ? (
        <button className="card-manage" data-done onClick={onAddCard}>
          <span className="cm-ic" aria-hidden>✓</span>
          <span className="cm-text">
            <span className="cm-title">Your {card.year} card</span>
            <span className="cm-sub">
              {card.hands.length} hand{card.hands.length === 1 ? '' : 's'} · set for the season
            </span>
          </span>
          <span className="cm-edit" aria-hidden>Edit</span>
        </button>
      ) : (
        <button className="card-sample-banner" onClick={onAddCard}>
          <span className="csb-tag" aria-hidden>SAMPLE</span>
          <span className="csb-text">
            <span className="csb-title">These are example hands — not your card</span>
            <span className="csb-sub">
              You haven’t scanned a card yet. Tap to {scanEnabled ? 'scan' : 'add'} your real one →
            </span>
          </span>
        </button>
      )}

      <div className="stats" style={{ marginTop: 16 }}>
        <div className="stat">
          <div className="num">
            <CountUp value={stats.cleared} />
            <span className="num-suf" style={{ color: 'var(--green)' }}>
              /{card.hands.length}
            </span>
          </div>
          <div className="lab" style={{ color: 'var(--green)' }}>
            Cleared
          </div>
        </div>
        <div className="stat">
          <div className="num"><CountUp value={stats.totalWins} /></div>
          <div className="lab" style={{ color: 'var(--brand)' }}>
            Mahjs
          </div>
        </div>
        <div className="stat">
          <div className="num"><CountUp value={stats.totalPoints} /></div>
          <div className="lab" style={{ color: '#C9871A' }}>
            Points
          </div>
        </div>
      </div>

      <button className="trophy-link" onClick={onTrophies}>
        <span className="tl-emblem" aria-hidden>
          <IconTrophy size={18} />
        </span>
        <span className="tl-text">
          <span className="tl-title">Stats &amp; Trophies</span>
          <span className="tl-sub">Badges · streaks · records</span>
        </span>
        <span className="tl-right">
          <span className="tl-count">
            {trophies.earned}/{trophies.total}
          </span>
          <span className="tl-chev" aria-hidden>›</span>
        </span>
      </button>

      <button className="mahj-hero" onClick={() => openLog()}>
        <span className="mahj-hero-shine" aria-hidden />
        <Tile face="crack" size={34} className="mahj-hero-tile" />
        <span className="mahj-hero-label">CALL MAHJ!</span>
      </button>

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

      <div className="segmented" style={{ marginTop: 18 }}>
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
              const inChallenge = challenge.match(h);
              return (
                <div
                  key={h.id}
                  className={`hand${count > 0 ? ' won' : ''}`}
                  data-challenge={inChallenge || undefined}
                  title={inChallenge ? `${challenge.season} Challenge hand` : undefined}
                >
                  <button
                    className="check"
                    data-checked={count > 0}
                    onClick={() => openLog(h.id)}
                    aria-label={`Log a win for "${h.notation}"`}
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

                  <span className="pts">
                    {h.concealed ? `C${h.points}` : `×${h.points}`}
                  </span>
                </div>
              );
            })}
          </section>
        );
      })}

      {wins.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <div className="cat-bar">
            <span className="cat-name" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <IconTrophy size={15} /> Your Mahjs
            </span>
            <span className="cat-count">
              {wins.length} logged
            </span>
          </div>
          {wins.map((w) => (
            <WinCard
              key={w.id}
              win={w}
              groupName={groupName}
              post={feed.find((p) => p.memberId === YOU_ID && p.createdAt === w.createdAt) ?? null}
              onRemove={() => onRemoveWin(w.id)}
              onPostToGroup={onPostToGroup}
            />
          ))}
        </section>
      )}

      {card.source !== 'custom' && (
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
      )}

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

      {logOpen && (
        <LogWinSheet
          card={card}
          handNotes={handNotes}
          groupName={groupName}
          initialHandId={logHandId}
          onClose={() => setLogOpen(false)}
          onSave={handleSaveWin}
        />
      )}
    </div>
  );
}
