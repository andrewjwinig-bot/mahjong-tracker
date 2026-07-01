'use client';

import { useRef, useState } from 'react';

// First-mahj empty state: a tactile gold coin that IS the "Call Mahj" button.
// Tapping it fires a one-time celebration (coin pop + a slow shower of gold 萬
// coins + an expanding ring), then opens the log-a-win flow. Shown on the Card
// empty state before any mahj has been called; once a mahj exists the normal
// CALL MAHJ button + mahjs list takes over.

const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

interface Piece {
  id: number;
  size: number;
  dx: number;
  dy: number;
  rot: number;
  dur: number;
  delay: number;
  glyph: boolean;
}

function makeBurst(seed: number): Piece[] {
  const pieces: Piece[] = [];
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 72 + Math.random() * 60; // 72–132px
    const size = 12 + Math.random() * 12; // 12–24px
    pieces.push({
      id: seed * 100 + i,
      size,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - 26, // biased upward
      rot: Math.random() * 480 - 240, // −240°…+240°
      dur: 1.2 + Math.random() * 0.5, // 1.2–1.7s
      delay: Math.random() * 0.08,
      glyph: size >= 18,
    });
  }
  return pieces;
}

export default function CallMahjCoin({ onCall }: { onCall: () => void }) {
  // A burst instance counter — bump per tap so the celebration remounts + replays.
  const [burst, setBurst] = useState(0);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const coinRef = useRef<HTMLButtonElement>(null);

  function tap() {
    if (reduced()) {
      onCall();
      return;
    }
    // Spring pop on the coin itself (Web Animations API, per the handoff).
    coinRef.current?.animate(
      [
        { transform: 'scale(1) rotate(0deg)' },
        { transform: 'scale(0.9) rotate(-4deg)', offset: 0.25 },
        { transform: 'scale(1.14) rotate(3deg)', offset: 0.55 },
        { transform: 'scale(0.98) rotate(0deg)', offset: 0.8 },
        { transform: 'scale(1) rotate(0deg)' },
      ],
      { duration: 640, easing: 'cubic-bezier(.2,.72,.3,1.06)' },
    );
    setPieces(makeBurst(burst + 1));
    setBurst((b) => b + 1);
    // Let the pop + first coins show, then open the log-a-win flow.
    window.setTimeout(onCall, 520);
  }

  return (
    <div className="coin-empty">
      <div className="coin-panel">
        <span className="coin-panel-top" aria-hidden />

        <h3 className="coin-title">The pot’s empty</h3>
        <p className="coin-sub">
          Win a hand? Give the coin a tap and call your first mahj for the table.
        </p>

        <div className="coin-stage">
          <span className="coin-glow" aria-hidden />
          <span className="coin-spark coin-spark-1" aria-hidden>✦</span>
          <span className="coin-spark coin-spark-2" aria-hidden>✦</span>
          <span className="coin-spark coin-spark-3" aria-hidden>✦</span>

          <span className="coin-bob">
            <button
              ref={coinRef}
              className="coin-btn"
              onClick={tap}
              aria-label="Call Mahj — no card needed"
            >
              <span className="coin-ring">
                <span className="coin-eyebrow">CALL</span>
                <span className="coin-word">Mahj!</span>
              </span>
            </button>
          </span>

          {/* Celebration burst — remounts per tap so repeated taps replay. */}
          {burst > 0 && (
            <span className="coin-burst" key={burst} aria-hidden>
              <span className="coin-ringwave" />
              {pieces.map((p) => (
                <span
                  key={p.id}
                  className={`coin-piece${p.glyph ? ' glyph' : ''}`}
                  style={
                    {
                      width: p.size,
                      height: p.size,
                      fontSize: p.size * 0.55,
                      '--dx': `${p.dx}px`,
                      '--dy': `${p.dy}px`,
                      '--rot': `${p.rot}deg`,
                      animationDuration: `${p.dur}s`,
                      animationDelay: `${p.delay}s`,
                    } as React.CSSProperties
                  }
                >
                  {p.glyph ? '萬' : ''}
                </span>
              ))}
            </span>
          )}
        </div>

        <div className="coin-hint">Tap the coin — no card needed</div>
      </div>
    </div>
  );
}
