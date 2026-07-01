'use client';

import { useEffect, useMemo, useState } from 'react';
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
import CallMahjCoin from './CallMahjCoin';
import ShareModal from './ShareModal';
import { LogWinSheet, WinCard } from './WinsTab';
import { ChallengeCard, SeasonsSheet } from './Challenges';
import { activeChallenge, challengeProgress, challengeHandIds } from '../lib/challenges';
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
  onScanCard: () => void;
  /** Just landed here from a guided card scan → fire the toast + confetti once. */
  scanCelebration?: { count: number; year: number } | null;
  onScanCelebrationDone?: () => void;
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
  onScanCard,
  scanCelebration,
  onScanCelebrationDone,
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

  // One-shot "hands saved" confetti — 26 felt/red/gold/blue/pink pieces that
  // rain once when you land here straight from a guided scan. Deterministic so
  // it renders identically on the server and client (no hydration mismatch).
  const confettiPieces = useMemo(() => {
    if (!scanCelebration) return [];
    const colors = ['#C0392B', '#2E7D43', '#E0A82E', '#2E78C8', '#D8607A'];
    return Array.from({ length: 26 }).map((_, i) => ({
      left: (i * 37 + 11) % 100,
      delay: ((i % 7) * 0.07).toFixed(2),
      dur: (1.5 + ((i * 13) % 9) / 10).toFixed(2),
      w: 6 + ((i * 5) % 6),
      h: 9 + ((i * 7) % 8),
      rot: (i % 2 ? 1 : -1) * (360 + ((i * 53) % 360)),
      color: colors[i % colors.length],
    }));
  }, [scanCelebration]);

  // The toast + confetti show once, then clear themselves after they've played.
  useEffect(() => {
    if (!scanCelebration || !onScanCelebrationDone) return;
    const t = setTimeout(onScanCelebrationDone, 5200);
    return () => clearTimeout(t);
  }, [scanCelebration, onScanCelebrationDone]);

  const challenge = useMemo(() => activeChallenge(), []);
  const chHands = useMemo(() => challengeHandIds(card, challenge), [card, challenge]);
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
    if (filter === 'challenge') return chHands.has(h.id);
    return true;
  };

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
    const bonus = h && chHands.has(h.id) ? `${challenge.emoji} ${challenge.season} season bonus!` : undefined;

    // First clear of a real card hand → milestone detection + big celebration.
    if (h && was === 0) {
      const newCleared = stats.cleared + 1;
      const catHands = card.hands.filter((x) => x.category === h.category);
      const catDone = catHands.every((x) => x.id === h.id || countOf(x) > 0);
      const cardDone = newCleared >= total;

      if (cardDone) onMilestone('card_cleared', 'Cleared the whole card!', `All ${total} hands 👑`);
      else if (catDone) onMilestone('section_cleared', `Cleared every ${h.category} hand`);
      if (chHands.has(h.id) && chProg.done < chProg.total && chProg.done + 1 >= chProg.total) {
        onMilestone('challenge_done', `Finished ${challenge.name}`);
      }

      // Only the big milestones still pop a celebration; a regular mahj logs
      // quietly (it's already saved + posted, and shows in your list).
      if (cardDone) {
        celebrate({ title: 'You Cleared The Card!!', emoji: '👑', hype: `ALL ${total} HANDS — LEGENDARY 👑`, cleared: newCleared, total, posted: opts.shareToGroup, big: true, bonus, onShare: () => setShareWin(win) });
      } else if (catDone) {
        celebrate({ title: 'Category Cleared! 🎉', emoji: '🏆', hype: `Every ${h.category} hand — done!`, handLabel: win.handLabel ?? h.notation, points: h.points, cleared: newCleared, total, posted: opts.shareToGroup, big: true, bonus, onShare: () => setShareWin(win) });
      }
    }
  }

  if (needsCard) {
    return (
      <div className="screen">
        <header className="app-header card-header">
          <CardTitle />
          <p className="sub">Track every hand on your card.</p>
        </header>
        <EmptyCard scanEnabled={scanEnabled} onScan={onScanCard} onManual={onAddCard} />

        {/* You can log a mahj even without a card — type the hand by hand.
            Scanning your card adds the tap-to-track hand list on top.
            First-run (no mahjs yet): the gold coin is the Call-Mahj button;
            once you've logged one, it reverts to the standard button + list. */}
        {wins.length === 0 ? (
          <CallMahjCoin onCall={() => openLog()} />
        ) : (
          <div className="no-card-mahj">
            <span className="ncm-or">or</span>
            <p className="ncm-text">Log another — no card needed.</p>
            <button className="mahj-hero" onClick={() => openLog()}>
              <span className="mahj-hero-shine" aria-hidden />
              <Tile face="crack" size={32} className="mahj-hero-tile" />
              <span className="mahj-hero-label">CALL MAHJ!</span>
            </button>
          </div>
        )}

        {wins.length > 0 && (
          <section style={{ marginTop: 22 }}>
            <div className="cat-bar">
              <span className="cat-name" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <IconTrophy size={15} /> Your Mahjs
              </span>
              <span className="cat-count">{wins.length} logged</span>
            </div>
            {wins.map((w) => (
              <WinCard
                key={w.id}
                win={w}
                groupName={groupName}
                onRemove={() => onRemoveWin(w.id)}
                onPostToGroup={onPostToGroup}
              />
            ))}
          </section>
        )}

        {logOpen && (
          <LogWinSheet
            card={card}
            handNotes={handNotes}
            groupName={groupName}
            manual
            onClose={() => setLogOpen(false)}
            onSave={handleSaveWin}
          />
        )}
      </div>
    );
  }

  return (
    <div className="screen">
      {scanCelebration && (
        <div className="scy-conf-layer" aria-hidden>
          {confettiPieces.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: -16,
                left: `${p.left}%`,
                width: p.w,
                height: p.h,
                background: p.color,
                borderRadius: 2,
                opacity: 0,
                ['--r' as string]: `${p.rot}deg`,
                animation: `scyConf ${p.dur}s cubic-bezier(.25,.6,.5,1) ${p.delay}s forwards`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      <header className="app-header card-header">
        <CardTitle />
        <p className="sub">Track every hand on this year’s card.</p>
      </header>

      {scanCelebration && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            background: '#DDEBDD',
            border: '1.5px solid rgba(46,125,67,0.30)',
            borderRadius: 12,
            padding: '11px 14px',
            margin: '4px 0 14px',
            animation: 'scyPop .45s ease both',
          }}
        >
          <span style={{ display: 'inline-flex', flex: 'none', width: 20, height: 20, borderRadius: '50%', background: '#2E7D43', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>✓</span>
          <span style={{ fontFamily: "var(--font-app), 'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 12.5, color: '#256037' }}>
            {scanCelebration.count} hands saved — your {scanCelebration.year} card is locked in for the season
          </span>
        </div>
      )}

      {/* A scanned (custom) card reads as confident and done for the year. In a
          demo build the sample is shown plainly as the card — no prompt, no
          "not scanned" mismatch. The real app never reaches here without a
          custom card (it shows the empty "add your card" state instead). */}
      {card.source === 'custom' && (
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
        <svg className="tl-stars" viewBox="0 0 200 60" preserveAspectRatio="xMaxYMid slice" aria-hidden>
          <text x="158" y="44" textAnchor="middle" fontSize="50" fill="#fff">★</text>
          <text x="116" y="26" textAnchor="middle" fontSize="26" fill="#fff">★</text>
          <text x="190" y="20" textAnchor="middle" fontSize="18" fill="#fff">★</text>
        </svg>
        <svg className="tl-trophy" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 4h12v5a6 6 0 0 1-12 0V4z" />
          <path d="M6 6H4v1a3 3 0 0 0 3 3" />
          <path d="M18 6h2v1a3 3 0 0 1-3 3" />
          <path d="M12 15v3" />
          <path d="M8.5 21h7" />
        </svg>
        <span className="tl-title">Stats &amp; Trophies</span>
        <span className="tl-right">
          <span className="tl-count">
            {trophies.earned}/{trophies.total}
          </span>
          <svg className="tl-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 18l6-6-6-6" />
          </svg>
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
              const inChallenge = chHands.has(h.id);
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
        <SeasonsSheet
          card={card}
          handCounts={handCounts}
          onClose={() => setSeasonsOpen(false)}
          onFocus={() => {
            setFilter('challenge');
            setSeasonsOpen(false);
          }}
        />
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
