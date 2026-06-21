'use client';

import type { MahjongCard } from '../lib/types';
import {
  CHALLENGES,
  activeChallenge,
  challengeProgress,
  seasonWindow,
  type Challenge,
} from '../lib/challenges';
import { IconGrid, IconSparkle } from './uiIcons';

/** The active-season challenge banner shown on the Card tab. */
export function ChallengeCard({
  challenge,
  done,
  total,
  focused,
  onToggleFocus,
  onSeasons,
}: {
  challenge: Challenge;
  done: number;
  total: number;
  focused: boolean;
  onToggleFocus: () => void;
  onSeasons: () => void;
}) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done >= total;

  return (
    <div className={`challenge${complete ? ' done' : ''}`}>
      <div className="ch-top">
        <span className="ch-emoji">{challenge.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ch-season">{challenge.season} Challenge</div>
          <div className="ch-name">{challenge.name}</div>
        </div>
        <button className="ch-seasons" onClick={onSeasons} aria-label="All seasons">
          <IconGrid size={17} />
        </button>
      </div>
      <p className="ch-blurb">{challenge.blurb}</p>
      <div className="ch-prog">
        <div className="progress" style={{ flex: 1, marginTop: 0 }}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <span className="ch-count" style={complete ? { display: 'inline-flex', alignItems: 'center', gap: 4 } : undefined}>
          {complete ? <><IconSparkle size={14} /> Done!</> : `${done}/${total}`}
        </span>
      </div>
      {!complete && (
        <button className="btn ghost ch-focus" onClick={onToggleFocus}>
          {focused ? 'Show all rows' : `${challenge.emoji} Focus these rows`}
        </button>
      )}
    </div>
  );
}

/** Sheet listing every quarterly season + your progress. */
export function SeasonsSheet({
  card,
  handCounts,
  onClose,
}: {
  card: MahjongCard;
  handCounts: Record<string, number>;
  onClose: () => void;
}) {
  const active = activeChallenge();
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h2>Challenge Seasons</h2>
        <p className="sheet-sub">A new themed goal every season.</p>

        {CHALLENGES.map((c) => {
          const { done, total } = challengeProgress(c, card, handCounts);
          const pct = total ? Math.round((done / total) * 100) : 0;
          const isActive = c.id === active.id;
          return (
            <div key={c.id} className={`season-row${isActive ? ' active' : ''}`}>
              <span className="ch-emoji">{c.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ch-name" style={{ fontSize: 15 }}>
                  {c.name}
                  {isActive && <span className="season-now">Now</span>}
                </div>
                <div className="season-when">
                  {c.season} · {seasonWindow(c)}
                </div>
                <div className="progress" style={{ marginTop: 6, height: 7 }}>
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="ch-count">
                {done}/{total}
              </span>
            </div>
          );
        })}

        <button className="btn ghost" style={{ marginTop: 16 }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
