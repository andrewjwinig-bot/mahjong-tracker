'use client';

import { useState } from 'react';
import type { MahjongCard } from '../lib/types';
import type { Profile } from '../lib/social';
import { computeStats, computeBadges } from '../lib/badges';
import { buildTrophyCard } from '../lib/shareCard';
import { appUrl } from '../lib/share';
import Avatar from './Avatar';
import ShareModal from './ShareModal';
import { IconShare, IconLock } from './uiIcons';

export default function TrophyShelf({
  card,
  handCounts,
  bestStreak,
  memberSince,
  profile,
  onClose,
}: {
  card: MahjongCard;
  handCounts: Record<string, number>;
  bestStreak: number;
  memberSince?: number;
  profile: Profile;
  onClose: () => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const s = computeStats(card, handCounts);
  const badges = computeBadges(card, handCounts, bestStreak);
  const earned = badges.filter((b) => b.earned);

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
