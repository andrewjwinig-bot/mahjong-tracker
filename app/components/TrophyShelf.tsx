'use client';

import { useState } from 'react';
import type { MahjongCard, Win } from '../lib/types';
import type { Profile } from '../lib/social';
import { computeStats, computeBadges } from '../lib/badges';
import { computeInsights } from '../lib/insights';
import { loadResults, gameWins } from '../lib/gameScorer';
import { usePro } from '../lib/usePro';
import { buildTrophyCard } from '../lib/shareCard';
import { appUrl } from '../lib/share';
import Avatar from './Avatar';
import ShareModal from './ShareModal';
import { IconShare, IconLock, IconStar, IconFlame, IconTarget, IconTrophy } from './uiIcons';
import { useEscape } from '../lib/useEscape';
import { useSwipeDismiss } from '../lib/useSwipeDismiss';

export default function TrophyShelf({
  card,
  handCounts,
  wins,
  bestStreak,
  memberSince,
  profile,
  onClose,
}: {
  card: MahjongCard;
  handCounts: Record<string, number>;
  wins: Win[];
  bestStreak: number;
  memberSince?: number;
  profile: Profile;
  onClose: () => void;
}) {
  useEscape(onClose);
  const swipe = useSwipeDismiss(onClose);
  const pro = usePro();
  const [shareOpen, setShareOpen] = useState(false);
  const s = computeStats(card, handCounts);
  const badges = computeBadges(card, handCounts, bestStreak);
  const earned = badges.filter((b) => b.earned);
  const ins = computeInsights(card, handCounts, wins);
  const topCats = ins.categories.filter((c) => c.total > 0).slice(0, 5);
  const gamesPlayed = loadResults().length;
  const myGameWins = gameWins(profile.name);

  const since = memberSince
    ? new Date(memberSince).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : '—';

  const stats: { label: string; value: string; color: string }[] = [
    { label: 'Cleared', value: `${s.cleared}/${s.total}`, color: 'var(--green)' },
    { label: 'Mahjs', value: `${s.mahjs}`, color: 'var(--brand)' },
    { label: 'Points', value: `${s.points}`, color: '#C9871A' },
    { label: 'Best streak', value: `${bestStreak}d`, color: '#2E86D4' },
  ];

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="sheet profile-sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
        {/* Cinnabar header band */}
        <div className="profile-band">
          <span className="md-stripe" aria-hidden />
          <div className="grab light" />
          <div className="profile-band-row">
            <span className="profile-band-tile">
              <Avatar avatar={profile.avatar} size={46} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="profile-name">{profile.name}</div>
              <div className="profile-handle">@{profile.handle}</div>
            </div>
            <button className="profile-share" onClick={() => setShareOpen(true)}>
              <IconShare size={15} /> SHARE
            </button>
          </div>
        </div>

        <div className="profile-body">
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <p className="sheet-sub" style={{ textAlign: 'left', margin: '0 2px 14px' }}>
            {earned.length}/{badges.length} trophies · since {since}
          </p>

          <div className="stat-row">
            {stats.map((st) => (
              <div className="stat-mini" key={st.label}>
                <div className="sm-num">{st.value}</div>
                <div className="sm-lab" style={{ color: st.color }}>{st.label}</div>
              </div>
            ))}
          </div>

          {(s.mahjs > 0 || gamesPlayed > 0) && (
          <>
            <div className="set-section">Your game</div>
            <div className="insight-list">
              {gamesPlayed > 0 && (
                <div className="insight-row">
                  <span className="insight-ic"><IconTrophy size={17} /></span>
                  <span className="insight-lab">Games scored</span>
                  <span className="insight-val">
                    {gamesPlayed} played{pro ? ` · ${myGameWins} won` : ''}
                  </span>
                </div>
              )}
              {ins.favorite && (
                <div className="insight-row">
                  <span className="insight-ic"><IconStar size={17} /></span>
                  <span className="insight-lab">Favorite hand</span>
                  <span className="insight-val" title={ins.favorite.label}>
                    {ins.favorite.label} · {ins.favorite.count}×
                  </span>
                </div>
              )}
              {ins.bestCategory && (
                <div className="insight-row">
                  <span className="insight-ic"><IconTarget size={17} /></span>
                  <span className="insight-lab">Best category</span>
                  <span className="insight-val">
                    {ins.bestCategory.category} · {ins.bestCategory.pct}%
                  </span>
                </div>
              )}
              {ins.busiestDay && (
                <div className="insight-row">
                  <span className="insight-ic"><IconFlame size={17} /></span>
                  <span className="insight-lab">Busiest day</span>
                  <span className="insight-val">{ins.busiestDay}</span>
                </div>
              )}
            </div>

            <div className="stat-row" style={{ marginTop: 10 }}>
              <div className="stat-mini">
                <div className="sm-num">{ins.mahjsLast7}</div>
                <div className="sm-lab">Last 7 days</div>
              </div>
              <div className="stat-mini">
                <div className="sm-num">{ins.mahjsLast30}</div>
                <div className="sm-lab">Last 30 days</div>
              </div>
              <div className="stat-mini">
                <div className="sm-num">{ins.avgPoints}</div>
                <div className="sm-lab">Avg points</div>
              </div>
              <div className="stat-mini">
                <div className="sm-num">{ins.longestDailyRun}d</div>
                <div className="sm-lab">Best run</div>
              </div>
            </div>

          </>
        )}

        {/* Category progress — always shown (reflects the card, even at 0). */}
        {topCats.length > 0 && (
          <>
            <div className="set-section">Category progress</div>
            <div className="cat-bars">
              {topCats.map((c) => (
                <div className="cat-bar-row" key={c.category}>
                  <span className="cb-name">{c.category}</span>
                  <span className="progress" style={{ flex: 1, height: 8, marginTop: 0 }}>
                    <span style={{ width: `${c.pct}%` }} />
                  </span>
                  <span className="cb-val">
                    {c.cleared}/{c.total}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="set-section">Trophies</div>
        <div className="trophy-grid">
          {badges.map((b, idx) => (
            <div
              className="trophy"
              data-earned={b.earned}
              key={b.id}
              title={b.desc}
              style={{ ['--i' as string]: idx } as React.CSSProperties}
            >
              <span className="trophy-emoji-wrap">
                <span className="trophy-emoji">{b.emoji}</span>
                {!b.earned && (
                  <span className="trophy-lock" aria-hidden>
                    <IconLock size={11} />
                  </span>
                )}
              </span>
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

      {shareOpen && (
        <ShareModal
          payload={{
            title: 'Share Your Stats 🏆',
            text: `${s.cleared}/${s.total} hands cleared, ${s.mahjs} mahjs, ${earned.length} trophies on Club Mahj! 🀄`,
            url: appUrl(),
            image: () =>
              buildTrophyCard({
                name: profile.name,
                cleared: s.cleared,
                total: s.total,
                mahjs: s.mahjs,
                points: s.points,
                bestStreak,
                earned: earned.length,
                totalBadges: badges.length,
                emojis: earned.map((b) => b.emoji),
              }),
          }}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
