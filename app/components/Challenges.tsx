'use client';

import type { MahjongCard } from '../lib/types';
import {
  CHALLENGES,
  activeChallenge,
  challengeProgress,
  seasonWindow,
  type Challenge,
} from '../lib/challenges';
import { IconSparkle } from './uiIcons';
import { useEscape } from '../lib/useEscape';

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
    <div className="challenge">
      <button className="ch-sun" onClick={onSeasons} aria-label="All challenge seasons">
        <svg viewBox="0 0 100 100" aria-hidden>
          <g stroke="#fff" strokeWidth="4.5" strokeLinecap="round">
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1="50" y1="4" x2="50" y2="15" transform={`rotate(${i * 30} 50 50)`} />
            ))}
          </g>
          <circle cx="50" cy="50" r="22" fill="none" stroke="#fff" strokeWidth="4.5" />
          <circle cx="50" cy="50" r="9" fill="#fff" />
        </svg>
      </button>
      <div className="ch-eyebrow">★ {challenge.season} Challenge</div>
      <div className="ch-name">{challenge.name}</div>
      <p className="ch-blurb">{challenge.blurb}</p>
      <div className="ch-prog">
        <div className="rack-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <span className="ch-count">
          {complete ? (
            <>
              <IconSparkle size={13} /> Done!
            </>
          ) : (
            `${done}/${total}`
          )}
        </span>
      </div>
      {!complete && (
        <button className="ch-focus" onClick={onToggleFocus}>
          {focused ? 'Show all rows' : 'Focus these rows'}
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
  useEscape(onClose);
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
