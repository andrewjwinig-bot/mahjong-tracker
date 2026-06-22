'use client';

import { useState } from 'react';
import type { MahjongCard, Win } from '../lib/types';
import type { Profile } from '../lib/social';
import { computeStats, computeBadges } from '../lib/badges';
import { computeInsights } from '../lib/insights';
import { loadResults, gameWins } from '../lib/gameScorer';
import { buildTrophyCard } from '../lib/shareCard';
import { appUrl } from '../lib/share';
import Avatar from './Avatar';
import ShareModal from './ShareModal';
import { IconShare, IconLock, IconStar, IconFlame, IconTarget, IconTrophy } from './uiIcons';
import { useEscape } from '../lib/useEscape';

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

        {/* Profile header */}
        <div className="profile-head">
          <Avatar avatar={profile.avatar} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="profile-name">{profile.name}</div>
            <div className="profile-handle">@{profile.handle}</div>
          </div>
          <button
            className="btn coral"
            style={{ width: 'auto', padding: '9px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => setShareOpen(true)}
          >
            <IconShare size={16} /> Share
          </button>
        </div>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        <p className="sheet-sub" style={{ textAlign: 'left', margin: '4px 2px 14px' }}>
          {earned.length}/{badges.length} trophies · since {since}
        </p>

        <div className="stat-row">
          {stats.map((st) => (
            <div className="stat-mini" key={st.label}>
              <div className="sm-num">{st.value}</div>
              <div className="sm-lab">{st.label}</div>
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
                    {gamesPlayed} played · {myGameWins} won
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

            {topCats.length > 0 && (
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
            )}
          </>
        )}

        <div className="set-section">Trophies</div>
        <div className="trophy-grid">
          {badges.map((b) => (
            <div className="trophy" data-earned={b.earned} key={b.id} title={b.desc}>
              <span className="trophy-emoji">{b.earned ? b.emoji : <IconLock size={22} />}</span>
              <span className="trophy-name">{b.name}</span>
              <span className="trophy-desc">{b.desc}</span>
            </div>
          ))}
        </div>

        <button className="btn ghost" style={{ marginTop: 16 }} onClick={onClose}>
          Done
        </button>
      </div>

      {shareOpen && (
        <ShareModal
          payload={{
            title: 'Share Your Stats 🏆',
            text: `${s.cleared}/${s.total} hands cleared, ${s.mahjs} mahjs, ${earned.length} trophies on Mahjong Tracker! 🀄`,
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
