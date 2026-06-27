'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { tileSVG, CONFETTI_FACES } from '../lib/tileArt';
import { playMahjChime, playFanfare, buzz, fxOn } from '../lib/sound';
import { IconShare, IconFeed } from './uiIcons';

export interface CelebrateOpts {
  title?: string;
  handLabel?: string | null;
  points?: number;
  /** Progress toward clearing the card. */
  cleared?: number;
  total?: number;
  /** Whether this mahj was already posted to your table chat. */
  posted?: boolean;
  /** Surface a Share action. */
  onShare?: () => void;
  /** Surface a "Post to chat" action (when not already posted). */
  onPost?: () => void;
  /** Override the boom emoji + hype line. */
  emoji?: string;
  hype?: string;
  /** Bigger, longer confetti storm (section / card-complete moments). */
  big?: boolean;
  /** Season-challenge bonus flair, e.g. "☀️ Summer season bonus!". */
  bonus?: string;
}

const HYPE = [
  'You’re on fire! 🔥',
  'Mahjong royalty 👑',
  'Tile master! 🀄',
  'Absolutely unstoppable 💪',
  'Big flex 😎',
  'Sparrows are singing 🐦',
  'Clean hand, clean win ✨',
];

interface ConfettiApi {
  /** Quick tile burst from a point (e.g. a checkbox). */
  burst: (origin?: { x: number; y: number }) => void;
  /** Full-screen tile celebration + the "I Got Mahj!" modal. */
  celebrate: (opts?: CelebrateOpts) => void;
  /** Full-screen confetti storm + fanfare, with NO modal — for callers that
   *  show their own celebratory UI (e.g. the scorer's game-over). */
  storm: () => void;
}

const ConfettiContext = createContext<ConfettiApi>({
  burst: () => {},
  celebrate: () => {},
  storm: () => {},
});

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

  // The big confetti storm + fanfare, without the I-Got-Mahj modal — for
  // callers that present their own celebratory UI on top.
  const storm = useCallback(() => {
    const fx = fxOn();
    if (fx) buzz();
    if (reduced()) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    for (let k = 0; k < 4; k++) {
      const x = W * (0.2 + Math.random() * 0.6);
      const y = H * (0.25 + Math.random() * 0.35);
      setTimeout(() => spawnBurst(x, y, 38, W), k * 320);
    }
    spawnRain(70);
    if (fx) playFanfare();
  }, [spawnBurst, spawnRain]);

  const celebrate = useCallback(
    (opts?: CelebrateOpts) => {
      setCelebration(opts ?? { title: 'I Got Mahj! 🎉' });
      const fx = fxOn();
      if (fx) buzz();
      if (reduced()) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      if (opts?.big) {
        // Major moment — a full storm: staggered bursts + heavy rain + fanfare.
        for (let k = 0; k < 4; k++) {
          const x = W * (0.2 + Math.random() * 0.6);
          const y = H * (0.25 + Math.random() * 0.35);
          setTimeout(() => spawnBurst(x, y, 38, W), k * 320);
        }
        spawnRain(70);
        if (fx) playFanfare();
      } else {
        spawnBurst(W / 2, H * 0.42, 40, Math.min(W, 460));
        spawnRain(26);
        if (fx) playMahjChime();
      }
    },
    [spawnBurst, spawnRain],
  );

  return (
    <ConfettiContext.Provider value={{ burst, celebrate, storm }}>
      {children}
      <div ref={layerRef} className="confetti-layer" aria-hidden />
      {celebration && (
        <CelebrationModal opts={celebration} onClose={() => setCelebration(null)} />
      )}
    </ConfettiContext.Provider>
  );
}

function CelebrationModal({ opts, onClose }: { opts: CelebrateOpts; onClose: () => void }) {
  const [posted, setPosted] = useState(!!opts.posted);
  // Pick a hype line once per celebration; upgrade to a milestone when earned.
  const hype = useMemo(() => {
    if (opts.hype) return opts.hype;
    if (opts.cleared != null && opts.total != null) {
      if (opts.cleared >= opts.total) return 'ALL 70 HANDS — LEGENDARY 👑';
      if (opts.cleared > 0 && opts.cleared % 10 === 0) return `${opts.cleared} hands down! 🙌`;
    }
    return HYPE[Math.floor(Math.random() * HYPE.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="celebrate-scrim" onClick={onClose}>
      <div className={`celebrate-card${opts.big ? ' big' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="boom">{opts.emoji ?? '🀄'}</div>
        <p className="cele-hype">{hype}</p>
        <h2>{opts.title ?? 'I Got Mahj! 🎉'}</h2>
        {opts.handLabel && <p className="cele-hand">{opts.handLabel}</p>}

        {(opts.points != null || opts.cleared != null) && (
          <div className="cele-stats">
            {opts.points != null && (
              <span className="cele-chip">
                +{opts.points} <small>pts</small>
              </span>
            )}
            {opts.cleared != null && opts.total != null && (
              <span className="cele-chip">
                {opts.cleared}/{opts.total} <small>cleared</small>
              </span>
            )}
          </div>
        )}

        {opts.bonus && <p className="cele-bonus">{opts.bonus}</p>}
        {posted && <p className="cele-posted">✓ Posted to your table chat</p>}

        <div className="cele-actions">
          {opts.onShare && (
            <button
              className="btn coral"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              onClick={() => {
                onClose();
                opts.onShare?.();
              }}
            >
              <IconShare size={17} /> Share It
            </button>
          )}
          {opts.onPost && !posted && (
            <button
              className="btn green"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              onClick={() => {
                opts.onPost?.();
                setPosted(true);
              }}
            >
              <IconFeed size={17} /> Post to chat
            </button>
          )}
          <button className="btn ghost" onClick={onClose}>
            Keep Going
          </button>
        </div>
      </div>
    </div>
  );
}
