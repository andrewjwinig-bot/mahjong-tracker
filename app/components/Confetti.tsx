'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { tileSVG, CONFETTI_FACES } from '../lib/tileArt';

export interface CelebrateOpts {
  title?: string;
  subtitle?: string | null;
  /** Optional share action surfaced in the celebration modal. */
  onShare?: () => void;
}

interface ConfettiApi {
  /** Quick tile burst from a point (e.g. a checkbox). */
  burst: (origin?: { x: number; y: number }) => void;
  /** Full-screen tile celebration + the "I Got Mahj!" modal. */
  celebrate: (opts?: CelebrateOpts) => void;
}

const ConfettiContext = createContext<ConfettiApi>({ burst: () => {}, celebrate: () => {} });

export function useConfetti(): ConfettiApi {
  return useContext(ConfettiContext);
}

const reduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function makeTile(): HTMLDivElement {
  const pick = CONFETTI_FACES[Math.floor(Math.random() * CONFETTI_FACES.length)];
  const el = document.createElement('div');
  el.className = 'confetti-tile';
  el.innerHTML = tileSVG(pick.face, { char: pick.char, color: pick.color });
  return el;
}

export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [celebration, setCelebration] = useState<CelebrateOpts | null>(null);

  // A burst of tiles flying out from (x, y), then drifting down under gravity.
  const spawnBurst = useCallback((x: number, y: number, count: number, spread: number) => {
    const layer = layerRef.current;
    if (!layer) return;
    for (let i = 0; i < count; i++) {
      const el = makeTile();
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      layer.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const dist = spread * (0.35 + Math.random() * 0.65);
      const dx = Math.cos(angle) * dist;
      const dyUp = Math.sin(angle) * dist - (120 + Math.random() * 150);
      const rot = Math.random() * 760 - 380;
      const dur = 1700 + Math.random() * 1100; // slower, floatier

      const anim = el.animate(
        [
          { transform: 'translate(-50%, -50%) translate(0,0) rotate(0deg) scale(0.3)', opacity: 1 },
          {
            offset: 0.28,
            transform: `translate(-50%, -50%) translate(${dx * 0.55}px, ${dyUp * 0.6}px) rotate(${rot * 0.4}deg) scale(1)`,
            opacity: 1,
          },
          {
            offset: 0.85,
            opacity: 1,
          },
          {
            transform: `translate(-50%, -50%) translate(${dx}px, ${dyUp + 720}px) rotate(${rot}deg) scale(0.9)`,
            opacity: 0,
          },
        ],
        { duration: dur, easing: 'cubic-bezier(0.12, 0.66, 0.3, 1)', fill: 'forwards' },
      );
      anim.onfinish = () => el.remove();
      anim.oncancel = () => el.remove();
    }
  }, []);

  // A gentle rain of tiles falling across the whole screen.
  const spawnRain = useCallback((count: number) => {
    const layer = layerRef.current;
    if (!layer) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    for (let i = 0; i < count; i++) {
      const el = makeTile();
      const x = Math.random() * W;
      el.style.left = `${x}px`;
      el.style.top = `-50px`;
      layer.appendChild(el);

      const drift = (Math.random() - 0.5) * 160;
      const rot = Math.random() * 720 - 360;
      const dur = 2400 + Math.random() * 1600; // slow drift down
      const delay = Math.random() * 500;

      const anim = el.animate(
        [
          { transform: 'translate(-50%, -50%) translate(0,0) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(-50%, -50%) translate(${drift}px, ${H + 120}px) rotate(${rot}deg)`,
            opacity: 1,
          },
        ],
        { duration: dur, delay, easing: 'cubic-bezier(0.4, 0.1, 0.6, 1)', fill: 'forwards' },
      );
      anim.onfinish = () => el.remove();
      anim.oncancel = () => el.remove();
    }
  }, []);

  const burst = useCallback(
    (origin?: { x: number; y: number }) => {
      if (reduced()) return;
      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? window.innerHeight * 0.4;
      spawnBurst(x, y, 22, 220);
    },
    [spawnBurst],
  );

  const celebrate = useCallback(
    (opts?: CelebrateOpts) => {
      setCelebration(opts ?? { title: 'I Got Mahj! 🎉' });
      if (reduced()) return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.42;
      spawnBurst(cx, cy, 40, Math.min(window.innerWidth, 460));
      spawnRain(26);
    },
    [spawnBurst, spawnRain],
  );

  return (
    <ConfettiContext.Provider value={{ burst, celebrate }}>
      {children}
      <div ref={layerRef} className="confetti-layer" aria-hidden />
      {celebration && (
        <CelebrationModal opts={celebration} onClose={() => setCelebration(null)} />
      )}
    </ConfettiContext.Provider>
  );
}

function CelebrationModal({ opts, onClose }: { opts: CelebrateOpts; onClose: () => void }) {
  return (
    <div className="celebrate-scrim" onClick={onClose}>
      <div className="celebrate-card" onClick={(e) => e.stopPropagation()}>
        <div className="boom">🀄</div>
        <h2>{opts.title ?? 'I Got Mahj! 🎉'}</h2>
        {opts.subtitle && <p className="cele-hand">{opts.subtitle}</p>}
        <div className="row" style={{ marginTop: 16 }}>
          {opts.onShare && (
            <button
              className="btn coral"
              onClick={() => {
                onClose();
                opts.onShare?.();
              }}
            >
              ↗ Share It
            </button>
          )}
          <button className="btn" onClick={onClose}>
            Keep Going
          </button>
        </div>
      </div>
    </div>
  );
}
