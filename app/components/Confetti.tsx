'use client';

import { createContext, useCallback, useContext, useRef } from 'react';

/** Fire a celebratory tile burst, optionally from a screen point. */
export type Burst = (origin?: { x: number; y: number }) => void;

const ConfettiContext = createContext<Burst>(() => {});

/** Trigger the "MAHJ" tile confetti from anywhere inside the provider. */
export function useConfetti(): Burst {
  return useContext(ConfettiContext);
}

// Tile faces: the letters of MAHJ plus a few real mahjong tile glyphs.
const FACES = ['M', 'A', 'H', 'J', '🀄', '🀇', '🀐', '🀙', '🀚', 'M', 'A', 'H', 'J'];
const LETTER_COLORS = ['#E8455F', '#23B196', '#3B7DD8', '#7C6BE6', '#E59A2B'];
const isGlyph = (s: string) => s.codePointAt(0)! > 0x2000;

export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const layerRef = useRef<HTMLDivElement>(null);

  const burst: Burst = useCallback((origin) => {
    const layer = layerRef.current;
    if (!layer) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? window.innerHeight * 0.4;
    const COUNT = 30;

    for (let i = 0; i < COUNT; i++) {
      const el = document.createElement('div');
      const face = FACES[Math.floor(Math.random() * FACES.length)];
      el.className = 'confetti-tile';
      el.textContent = face;
      if (!isGlyph(face)) {
        el.style.color = LETTER_COLORS[Math.floor(Math.random() * LETTER_COLORS.length)];
      }
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      layer.appendChild(el);

      // Burst outward, then fall under "gravity".
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 170;
      const dx = Math.cos(angle) * dist;
      const dyUp = Math.sin(angle) * dist - (130 + Math.random() * 140);
      const rot = Math.random() * 720 - 360;
      const dur = 950 + Math.random() * 750;

      const anim = el.animate(
        [
          { transform: 'translate(-50%, -50%) translate(0, 0) rotate(0deg) scale(0.3)', opacity: 1 },
          {
            offset: 0.25,
            transform: `translate(-50%, -50%) translate(${dx * 0.5}px, ${dyUp * 0.6}px) rotate(${rot * 0.4}deg) scale(1)`,
            opacity: 1,
          },
          {
            transform: `translate(-50%, -50%) translate(${dx}px, ${dyUp + 460}px) rotate(${rot}deg) scale(0.85)`,
            opacity: 0,
          },
        ],
        { duration: dur, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)', fill: 'forwards' },
      );
      anim.onfinish = () => el.remove();
      anim.oncancel = () => el.remove();
    }
  }, []);

  return (
    <ConfettiContext.Provider value={burst}>
      {children}
      <div ref={layerRef} className="confetti-layer" aria-hidden />
    </ConfettiContext.Provider>
  );
}
