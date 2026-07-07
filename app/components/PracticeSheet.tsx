'use client';

import { useState } from 'react';
import type { MahjongCard } from '../lib/types';
import {
  type RackTile,
  type HandMatch,
  type TileSpec,
  analyzeRack,
  SUITS,
  SUIT_FACE,
} from '../lib/handMatch';
import Tile from './Tile';
import Paywall from './Paywall';
import { colorNotation } from '../lib/theme';
import { useEscape } from '../lib/useEscape';
import { useSwipeDismiss } from '../lib/useSwipeDismiss';
import { usePro } from '../lib/usePro';
import { setPro } from '../lib/pro';
import { IconTrash, IconTarget, IconLock } from './uiIcons';

const FREE_KEY = 'mahj.practiceUsed';
const RACK_MAX = 14;

const WIND_CHAR: Record<string, string> = { E: '東', S: '南', W: '西', N: '北' };
const DRAGON: Record<string, { char: string; color: string }> = {
  R: { char: '中', color: '#E8455F' },
  G: { char: '發', color: '#1FA85B' },
  W: { char: '白', color: '#2F80ED' },
};

function specOf(t: RackTile): TileSpec {
  if (t.t === 'num') return { face: SUIT_FACE[t.suit], count: t.value };
  if (t.t === 'wind') return { face: 'wind', char: WIND_CHAR[t.wind] };
  if (t.t === 'dragon') return { face: 'dragon', char: DRAGON[t.color].char, color: DRAGON[t.color].color };
  if (t.t === 'flower') return { face: 'flower' };
  return { face: 'joker' };
}

// The full palette, in card order.
const PALETTE: RackTile[] = [
  ...SUITS.flatMap((suit) => Array.from({ length: 9 }, (_, i) => ({ t: 'num', suit, value: i + 1 } as RackTile))),
  ...(['E', 'S', 'W', 'N'] as const).map((wind) => ({ t: 'wind', wind } as RackTile)),
  ...(['R', 'G', 'W'] as const).map((color) => ({ t: 'dragon', color } as RackTile)),
  { t: 'flower' },
  { t: 'joker' },
];

export default function PracticeSheet({ card, onClose }: { card: MahjongCard; onClose: () => void }) {
  useEscape(onClose);
  const swipe = useSwipeDismiss(onClose);
  const pro = usePro();
  const [rack, setRack] = useState<RackTile[]>([]);
  const [results, setResults] = useState<HandMatch[] | null>(null);
  const [paywall, setPaywall] = useState(false);

  function add(t: RackTile) {
    setResults(null);
    setRack((prev) => (prev.length >= RACK_MAX ? prev : [...prev, t]));
  }
  function removeAt(i: number) {
    setResults(null);
    setRack((prev) => prev.filter((_, j) => j !== i));
  }

  function analyze() {
    let used = false;
    try {
      used = localStorage.getItem(FREE_KEY) === '1';
    } catch {
      /* ignore */
    }
    if (!pro && used) {
      setPaywall(true);
      return;
    }
    setResults(analyzeRack(card, rack));
    if (!pro) {
      try {
        localStorage.setItem(FREE_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
        <div className="grab" />
        <div className="pr-hero">
          <span className="pr-medal" aria-hidden>
            <span className="pr-ring" />
            <IconTarget size={26} />
          </span>
          <div>
            <div className="pr-kicker">PRACTICE · STUDY THE CARD</div>
            <h2 className="pr-title">What can I make?</h2>
          </div>
        </div>
        <p className="sheet-sub">
          Build a rack and see which hands you’re closest to. For studying the card — not for live play.
        </p>

        {/* Your rack */}
        <label className="lbl">
          Your tiles <span style={{ color: 'var(--muted)' }}>({rack.length}/{RACK_MAX})</span>
        </label>
        <div className="rack">
          {rack.length === 0 ? (
            <span className="rack-empty">Tap tiles below to build your hand…</span>
          ) : (
            rack.map((t, i) => {
              const s = specOf(t);
              return (
                <button key={i} className="rack-tile" onClick={() => removeAt(i)} aria-label="Remove tile">
                  <Tile face={s.face} count={s.count} char={s.char} color={s.color} size={34} />
                </button>
              );
            })
          )}
        </div>
        {rack.length > 0 && (
          <button
            className="btn ghost"
            style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
            onClick={() => {
              setRack([]);
              setResults(null);
            }}
          >
            <IconTrash size={16} /> Clear
          </button>
        )}

        {/* Palette */}
        <label className="lbl" style={{ marginTop: 14 }}>
          Add tiles
        </label>
        <div className="palette">
          {PALETTE.map((t, i) => {
            const s = specOf(t);
            return (
              <button key={i} className="palette-tile" onClick={() => add(t)} disabled={rack.length >= RACK_MAX}>
                <Tile face={s.face} count={s.count} char={s.char} color={s.color} size={30} />
              </button>
            );
          })}
        </div>

        <button className="btn" style={{ marginTop: 14 }} disabled={rack.length === 0} onClick={analyze}>
          What can I make?
        </button>
        {!pro && (
          <p style={{ margin: '8px 2px 0', textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)' }}>
            1 free analysis — go VIP for unlimited practice.
          </p>
        )}

        {/* Results */}
        {results && (
          <>
            <div className="set-section">You’re closest to</div>
            {results.slice(0, 6).map((m, idx) => {
              const away = Math.max(0, m.total - m.matched);
              return (
              <div
                className="match-row"
                key={m.hand.id}
                data-close={away <= 2 ? 'true' : undefined}
                style={{ ['--i' as string]: idx } as React.CSSProperties}
              >
                <div className="match-head">
                  <span className="match-rank">{idx + 1}</span>
                  <span className="match-notation">
                    {colorNotation(m.hand.notation).map((g, j) => (
                      <span key={j} className={g.cls}>{g.text} </span>
                    ))}
                  </span>
                  <span className="match-away" data-done={away === 0 ? 'true' : undefined}>
                    {away === 0 ? 'Complete!' : `${away} away`}
                  </span>
                </div>
                <div className="pr-bar"><span style={{ width: `${m.pct}%` }} /></div>
                <div className="match-meta">
                  <span style={{ color: 'var(--muted)' }}>
                    {m.hand.category} · {m.hand.points} pts
                    {m.usedJokers > 0 ? ` · ${m.usedJokers} joker${m.usedJokers === 1 ? '' : 's'}` : ''}
                  </span>
                </div>
                {m.need.length > 0 && (
                  <div className="match-need">
                    <span className="need-lbl">Need</span>
                    {m.need.slice(0, 8).map((n, j) => (
                      <span className="need-tile" key={j}>
                        {n.count > 1 && <span className="need-x">{n.count}×</span>}
                        <Tile face={n.spec.face} count={n.spec.count} char={n.spec.char} color={n.spec.color} size={24} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
              );
            })}
          </>
        )}
      </div>

      {paywall && (
        <Paywall
          onUnlock={() => {
            setPro(true);
            setPaywall(false);
            setResults(analyzeRack(card, rack));
          }}
          onClose={() => setPaywall(false)}
        />
      )}
    </div>
  );
}
