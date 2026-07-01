'use client';

import type { CSSProperties } from 'react';
import type { MahjongCard } from '../lib/types';
import {
  CHALLENGES,
  activeChallengeIndex,
  cardYearLabel,
  challengeProgress,
  seasonWindow,
  type Challenge,
} from '../lib/challenges';
import { IconSparkle } from './uiIcons';
import { useEscape } from '../lib/useEscape';
import { useSwipeDismiss } from '../lib/useSwipeDismiss';

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

// ---- Challenge Seasons modal (Redesign_17) --------------------------------

type MotifName = 'flower' | 'sun' | 'leaf' | 'present' | 'firework';

// Per-season art tokens: chip gradient (light→deep), chip shadow, the motif, and
// the primary color (`chal`) that tints the featured "NOW" card + its text.
const VISUALS: Record<
  string,
  {
    motif: MotifName;
    g1: string;
    g2: string;
    shadow: string;
    chal: string; // featured-card primary + progress fill
    now: { title: string; eyebrow: string; tagline: string; count: string };
    up: { pill: string; eyebrow: string; name: string }; // "up next" state
  }
> = {
  spring: {
    motif: 'flower',
    g1: '#E570A4',
    g2: '#C24A82',
    shadow: 'rgba(194,74,130,0.32)',
    chal: '#D14E86',
    now: { title: '#6E1E45', eyebrow: '#B03A72', tagline: '#7A4E63', count: '#A83A6E' },
    up: { pill: '#E570A4', eyebrow: '#C24A82', name: '#7A2A50' },
  },
  summer: {
    motif: 'sun',
    g1: '#2ED0B4',
    g2: '#0E9C84',
    shadow: 'rgba(14,120,105,0.42)',
    chal: '#10B39A',
    now: { title: '#0C4F45', eyebrow: '#0C8C79', tagline: '#3D6159', count: '#0C7C6B' },
    up: { pill: '#2ED0B4', eyebrow: '#0E9C84', name: '#0C4F45' },
  },
  autumn: {
    motif: 'leaf',
    g1: '#C2703A',
    g2: '#9C4A22',
    shadow: 'rgba(156,74,34,0.32)',
    chal: '#B5612E',
    now: { title: '#5A2E14', eyebrow: '#9C4A22', tagline: '#6E4A34', count: '#8A4A22' },
    up: { pill: '#C2703A', eyebrow: '#B5763F', name: '#6E4526' },
  },
  yearsend: {
    motif: 'present',
    g1: '#A24B90',
    g2: '#5E2450',
    shadow: 'rgba(94,36,80,0.3)',
    chal: '#8A3A78',
    now: { title: '#401A38', eyebrow: '#7A2E6A', tagline: '#5E3E58', count: '#6E2860' },
    up: { pill: '#A24B90', eyebrow: '#7A2E6A', name: '#401A38' },
  },
  finale: {
    motif: 'firework',
    g1: '#3159A0',
    g2: '#1B335E',
    shadow: 'rgba(27,51,94,0.34)',
    chal: '#2A4E8C',
    now: { title: '#14284A', eyebrow: '#2A4E8C', tagline: '#3E4E68', count: '#24406E' },
    up: { pill: '#3159A0', eyebrow: '#2A4E8C', name: '#14284A' },
  },
};

/** The shared white line-icon family (built on a 100×100 box). */
function Motif({ name, color, size }: { name: MotifName; color: string; size: number }) {
  const common = { viewBox: '0 0 100 100', width: size, height: size, 'aria-hidden': true } as const;
  if (name === 'sun') {
    return (
      <svg {...common}>
        <g fill="none" stroke={color} strokeWidth="6" strokeLinecap="round">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1="50" y1="5" x2="50" y2="16" transform={`rotate(${i * 30} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="21" />
        </g>
        <circle cx="50" cy="50" r="9" fill={color} />
      </svg>
    );
  }
  if (name === 'flower') {
    return (
      <svg {...common}>
        <g fill="none" stroke={color} strokeWidth="5.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <ellipse key={i} cx="50" cy="25" rx="8.5" ry="15" transform={`rotate(${i * 60} 50 50)`} />
          ))}
        </g>
        <circle cx="50" cy="50" r="9.5" fill={color} />
      </svg>
    );
  }
  if (name === 'leaf') {
    return (
      <svg {...common} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 5 C71 23 71 47 50 66 C29 47 29 23 50 5 Z" />
        <line x1="50" y1="11" x2="50" y2="71" />
        <line x1="50" y1="26" x2="65" y2="20" />
        <line x1="50" y1="26" x2="35" y2="20" />
        <line x1="50" y1="40" x2="64" y2="35" />
        <line x1="50" y1="40" x2="36" y2="35" />
        <line x1="50" y1="53" x2="62" y2="49" />
        <line x1="50" y1="53" x2="38" y2="49" />
      </svg>
    );
  }
  if (name === 'present') {
    return (
      <svg {...common} fill="none" stroke={color} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="18" y="34" width="64" height="34" rx="6" />
        <line x1="50" y1="34" x2="50" y2="68" />
        <ellipse cx="39" cy="24" rx="10" ry="7" transform="rotate(-20 39 24)" />
        <ellipse cx="61" cy="24" rx="10" ry="7" transform="rotate(20 61 24)" />
        <circle cx="50" cy="28" r="3" fill={color} />
      </svg>
    );
  }
  // firework
  return (
    <svg {...common}>
      <g stroke={color} strokeWidth="5.5" strokeLinecap="round">
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1="50" y1="31" x2="50" y2="13" transform={`rotate(${i * 45} 50 50)`} />
        ))}
      </g>
      <g fill={color}>
        {Array.from({ length: 8 }).map((_, i) => (
          <circle key={i} cx="50" cy="9" r="3" transform={`rotate(${i * 45} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="6.5" />
      </g>
    </svg>
  );
}

const upper = (s: string) => s.toUpperCase().replace(/ – /, '–');

/** One season in the journey timeline: motif chip on the spine + a state card. */
function SeasonRow({
  challenge,
  index,
  state,
  done,
  total,
  showSpine,
  onFocus,
}: {
  challenge: Challenge;
  index: number;
  state: 'cleared' | 'ended' | 'now' | 'upnext' | 'locked';
  done: number;
  total: number;
  showSpine: boolean;
  onFocus: () => void;
}) {
  const v = VISUALS[challenge.id];
  const pct = total ? Math.round((done / total) * 100) : 0;
  const win = seasonWindow(challenge);
  const eyebrow = upper(`${challenge.season} · ${win}`);
  const startDate = upper(win.split(' – ')[0]);
  const isNow = state === 'now';

  return (
    <div className="ssn-row" style={{ ['--i' as string]: index } as CSSProperties}>
      <div className="ssn-rail">
        <div
          className={`ssn-chip${isNow ? ' now' : ''}`}
          style={
            {
              background: `linear-gradient(157deg, ${v.g1}, ${v.g2})`,
              ['--chipsh' as string]: v.shadow,
            } as CSSProperties
          }
        >
          <Motif name={v.motif} color={isNow ? '#FFE08A' : '#FFFFFF'} size={isNow ? 33 : v.motif === 'leaf' ? 41 : v.motif === 'present' ? 37 : 36} />
        </div>
        {showSpine && <div className="ssn-spine" />}
      </div>

      {state === 'now' ? (
        <div
          className="ssn-card now"
          style={
            {
              ['--chal' as string]: v.chal,
              background: `radial-gradient(150px 90px at 100% 50%, color-mix(in srgb, ${v.chal} 16%, transparent), transparent 72%), linear-gradient(180deg, color-mix(in srgb, ${v.chal} 14%, #fff), color-mix(in srgb, ${v.chal} 8%, #fff))`,
              border: `2.5px solid color-mix(in srgb, ${v.chal} 42%, transparent)`,
            } as CSSProperties
          }
        >
          <div className="ssn-watermark" aria-hidden>
            <Motif name={v.motif} color={v.chal} size={118} />
          </div>
          <div className="ssn-now-head">
            <span className="ssn-now-badge">● NOW</span>
            <span className="ssn-eb" style={{ color: v.now.eyebrow, margin: 0 }}>
              {eyebrow}
            </span>
          </div>
          <div className="ssn-name now" style={{ color: v.now.title }}>
            {challenge.name}
          </div>
          <div className="ssn-tagline" style={{ color: v.now.tagline }}>
            {challenge.blurb}
          </div>
          <div className="ssn-prog" style={{ position: 'relative' }}>
            <div className="ssn-bar" style={{ height: 10, background: `color-mix(in srgb, ${v.chal} 18%, transparent)` }}>
              <span style={{ width: `${pct}%`, background: v.chal }} />
            </div>
            <span className="ssn-count" style={{ color: v.now.count, fontWeight: 700, fontSize: 12 }}>
              {done}/{total}
            </span>
          </div>
          <button
            className="ssn-cta"
            onClick={onFocus}
            style={{ background: v.chal, boxShadow: `0 4px 12px color-mix(in srgb, ${v.chal} 32%, transparent)` }}
          >
            Focus these rows on my card →
          </button>
        </div>
      ) : state === 'upnext' ? (
        <div className="ssn-card upnext" style={{ borderColor: `color-mix(in srgb, ${v.chal} 32%, transparent)` }}>
          <div>
            <div className="ssn-tagrow">
              <span className="ssn-pill upnext" style={{ background: v.up.pill }}>
                UP NEXT
              </span>
              <span className="ssn-eb" style={{ color: v.up.eyebrow, margin: 0 }}>
                {eyebrow}
              </span>
            </div>
            <div className="ssn-name" style={{ color: v.up.name }}>
              {challenge.name}
            </div>
          </div>
          <div className="ssn-lock" style={{ color: v.up.eyebrow }}>
            <LockIcon />
          </div>
        </div>
      ) : state === 'locked' ? (
        <div className="ssn-card locked">
          <div>
            <div className="ssn-eb" style={{ color: '#A9B3AC' }}>
              {eyebrow}
            </div>
            <div className="ssn-name" style={{ color: '#8C948D' }}>
              {challenge.name}
            </div>
          </div>
          <div className="ssn-lock" style={{ color: '#A9B3AC' }}>
            <LockIcon />
            <span className="ssn-lockdate">{startDate}</span>
          </div>
        </div>
      ) : (
        // cleared / ended (past)
        <div className="ssn-card past">
          <div className="ssn-past-head">
            <div>
              <div className="ssn-eb" style={{ color: v.g2 }}>
                {eyebrow}
              </div>
              <div className="ssn-name" style={{ color: '#2A2A30' }}>
                {challenge.name}
              </div>
            </div>
            {state === 'cleared' ? (
              <span className="ssn-pill cleared">
                <IconSparkle size={11} /> CLEARED
              </span>
            ) : (
              <span className="ssn-pill ended">ENDED</span>
            )}
          </div>
          <div className="ssn-prog">
            <div className="ssn-bar">
              <span style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${v.g1}, ${v.g2})` }} />
            </div>
            <span className="ssn-count">
              {done}/{total}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 14 16" aria-hidden style={{ marginBottom: 1 }}>
      <path d="M3 7 V5 a4 4 0 0 1 8 0 V7" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="2" y="7" width="10" height="7.5" rx="2" fill="currentColor" />
    </svg>
  );
}

/** The card year as a five-season journey — past, present (featured), future. */
export function SeasonsSheet({
  card,
  handCounts,
  onClose,
  onFocus,
}: {
  card: MahjongCard;
  handCounts: Record<string, number>;
  onClose: () => void;
  onFocus: () => void;
}) {
  useEscape(onClose);
  const swipe = useSwipeDismiss(onClose);
  const activeIdx = activeChallengeIndex();
  const active = CHALLENGES[activeIdx];

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="ssn-sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
        <div className="ssn-grab-wrap">
          <div className="ssn-grab" />
        </div>

        <div className="ssn-head">
          <div className="ssn-eyebrow">
            {active.emoji} SEASON {activeIdx + 1} OF {CHALLENGES.length} · {cardYearLabel()}
          </div>
          <div className="ssn-title">Challenge Seasons</div>
          <div className="ssn-sub">One themed goal each season — chase them all to clear the year.</div>
        </div>

        <div className="ssn-list">
          {CHALLENGES.map((c, idx) => {
            const { done, total } = challengeProgress(c, card, handCounts);
            let state: 'cleared' | 'ended' | 'now' | 'upnext' | 'locked';
            if (idx < activeIdx) state = total > 0 && done >= total ? 'cleared' : 'ended';
            else if (idx === activeIdx) state = 'now';
            else if (idx === activeIdx + 1) state = 'upnext';
            else state = 'locked';
            return (
              <SeasonRow
                key={c.id}
                challenge={c}
                index={idx}
                state={state}
                done={done}
                total={total}
                showSpine={idx < CHALLENGES.length - 1}
                onFocus={onFocus}
              />
            );
          })}
        </div>

        <div className="ssn-foot">
          <button className="ssn-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
