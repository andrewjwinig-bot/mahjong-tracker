'use client';

// Club Mahj launch splash — "Washing the Tiles". EXACT port of the reference
// (Shuffle_Splash reference.html): same felt, tile mix, seeded RNG, distances,
// timings, easings and keyframes. The tile field is built imperatively against
// refs (1:1 with the reference's render()), so nothing about the motion changes.
//
// Lifecycle: plays the tumble-in once on cold launch, washes while `ready` is
// false, then fade/scale-exits (~300ms) and calls onDone. Minimum ~1.2s on
// screen so the entrance always completes.

import { useEffect, useRef, useState } from 'react';

export default function Splash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const screenRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<HTMLDivElement>(null);
  const lockInnerRef = useRef<HTMLDivElement>(null);
  const [minElapsed, setMinElapsed] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Build the tile field once on mount (tumble-in → wash loop). Verbatim port.
  useEffect(() => {
    const SCREEN = screenRef.current;
    const TILES = tilesRef.current;
    const LOCK_INNER = lockInnerRef.current;
    if (!SCREEN || !TILES || !LOCK_INNER) return;

    const faceGreen = 'linear-gradient(158deg,#249150 0%,#178043 52%,#0E5A2A 100%)';
    const faceCream = 'linear-gradient(180deg,#FFFEFB 0%,#F1EBDD 100%)';
    const chars = [['中', '#C0392B'], ['發', '#15803D'], ['東', '#1A1410'], ['南', '#1A1410'], ['西', '#1A1410'], ['北', '#1A1410']];
    const nums = ['一', '二', '三', '五', '八', '九'];

    // face-up tile inner art (cream tiles). Face-down tiles are blank green backs.
    function faceArt(tile: any) {
      const s = 'transform:scale(' + tile.scale + ')';
      if (tile.isChar) return '<span style="font-family:\'Noto Serif SC\',\'Bricolage Grotesque\',serif;font-weight:900;font-size:' + tile.fs + 'px;line-height:1;color:' + tile.col + '">' + tile.glyph + '</span>';
      if (tile.isCrak) return '<div style="' + s + '"><div style="display:flex;flex-direction:column;align-items:center;line-height:0.78"><span style="font-family:\'Noto Serif SC\',serif;font-weight:900;font-size:12px;color:#1E6FCB">' + tile.num + '</span><span style="font-family:\'Noto Serif SC\',serif;font-weight:900;font-size:19px;color:#C0392B">萬</span></div></div>';
      if (tile.isBam) {
        const tall = 'width:5px;height:26px;border-radius:3px;background:linear-gradient(180deg,transparent 29%,rgba(8,40,20,.5) 30%,rgba(8,40,20,.5) 33%,transparent 34%,transparent 62%,rgba(8,40,20,.5) 63%,rgba(8,40,20,.5) 66%,transparent 67%),linear-gradient(90deg,#0C5026,#2BA45C 48%,#0C5026)';
        const shortB = 'width:5px;height:17px;border-radius:3px;background:linear-gradient(180deg,transparent 45%,rgba(8,40,20,.5) 46%,rgba(8,40,20,.5) 49%,transparent 50%),linear-gradient(90deg,#0C5026,#2BA45C 48%,#0C5026)';
        return '<div style="' + s + '"><div style="display:flex;align-items:flex-end;gap:3px"><div style="' + tall + '"></div><div style="' + shortB + '"></div><div style="' + tall + '"></div></div></div>';
      }
      if (tile.isDot) return '<div style="' + s + '"><div style="width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 50% 50%,#2E86D4 0 24%,transparent 25% 50%,#1E6FCB 51% 76%,transparent 77%)"></div></div>';
      if (tile.isFlower) {
        const petal = 'position:absolute;left:50%;bottom:50%;width:11px;height:15px;margin-left:-5.5px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:linear-gradient(180deg,#F9A8D4,#DB2777);transform-origin:50% 100%;transform:rotate(';
        let p = '';
        for (const a of [0, 60, 120, 180, 240, 300]) p += '<div style="' + petal + a + 'deg)"></div>';
        return '<div style="' + s + '"><div style="position:relative;width:26px;height:26px">' + p + '<div style="position:absolute;left:50%;top:50%;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#FBD37A,#E0941C);transform:translate(-50%,-50%);box-shadow:0 1px 2px rgba(0,0,0,0.2)"></div></div></div>';
      }
      return '';
    }

    function build(intro: boolean) {
      const W = SCREEN!.clientWidth, H = SCREEN!.clientHeight; // adapt to the real screen
      let seed = 20260625;                                   // KEEP — fixed layout
      const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
      const N = 50; const out: any[] = []; let tries = 0;
      while (out.length < N && tries < 4000) {
        tries++;
        const x = 3 + rnd() * 94;          // % position
        const y = 2 + rnd() * 96;
        if (x > 26 && x < 74 && y > 35 && y < 65) continue;          // keep center clear for the lockup
        const w = Math.round(30 + rnd() * 16);
        const h = Math.round(w * 1.27);
        const rot = Math.round((rnd() - 0.5) * 88);
        const wk = (out.length % 3) + 1;                     // wash1/2/3
        const washDur = (2.0 + rnd() * 1.5).toFixed(2);
        const faceUp = rnd() < 0.32;                         // ~32% cream face-up, rest green backs
        const edge = faceUp ? '#D9CFB6' : '#E7DFCB';

        // tumble-out from center, nearer tiles erupt first
        const sx = (50 - x) / 100 * W;
        const sy = (50 - y) / 100 * H;
        const r0 = rot + (rnd() - 0.5) * 420;
        const dist = Math.sqrt((x - 50) * (x - 50) + (y - 50) * (y - 50));
        const inDelay = (dist / 68 * 0.34 + rnd() * 0.1).toFixed(3);
        const washDelay = intro ? (0.72 + parseFloat(inDelay) + 0.05).toFixed(2) : (rnd() * 1.8).toFixed(2);

        const tile: any = {
          x, y, w, h, rot, sx, sy, r0, inDelay, washDelay, wk, washDur, faceUp, edge,
          isChar: false, isCrak: false, isBam: false, isDot: false, isFlower: false,
          glyph: '', col: '', num: '', fs: 0, scale: (w / 40).toFixed(2),
        };

        if (faceUp) {
          const pick = rnd();
          if (pick < 0.20) tile.isBam = true;
          else if (pick < 0.38) tile.isDot = true;
          else if (pick < 0.52) tile.isFlower = true;
          else if (pick < 0.70) { tile.isCrak = true; tile.num = nums[Math.floor(rnd() * nums.length)]; }
          else { const c = chars[Math.floor(rnd() * chars.length)]; tile.isChar = true; tile.glyph = c[0]; tile.col = c[1]; tile.fs = Math.round(h * 0.52); }
        }
        out.push(tile);
      }
      return out;
    }

    function render(intro: boolean) {
      const list = build(intro);
      TILES!.innerHTML = '';
      for (const t of list) {
        const outer = document.createElement('div');
        outer.style.cssText = 'position:absolute;left:' + t.x.toFixed(1) + '%;top:' + t.y.toFixed(1) + '%;transform:translate(-50%,-50%)';
        const mid = document.createElement('div');
        mid.style.cssText = intro
          ? 'transform:rotate(' + t.rot + 'deg);animation:tumbleOut 0.72s cubic-bezier(.2,.74,.3,1.08) ' + t.inDelay + 's both;--sx:' + t.sx.toFixed(0) + 'px;--sy:' + t.sy.toFixed(0) + 'px;--r0:' + t.r0.toFixed(0) + 'deg;--rf:' + t.rot + 'deg'
          : 'transform:rotate(' + t.rot + 'deg)';
        const inner = document.createElement('div');
        inner.style.cssText = 'position:relative;display:flex;align-items:center;justify-content:center;width:' + t.w + 'px;height:' + t.h + 'px;border-radius:' + Math.round(t.w * 0.17) + 'px;background:' + (t.faceUp ? faceCream : faceGreen) + ';box-shadow:0 4px 0 ' + t.edge + ',0 11px 16px rgba(7,24,13,0.42),inset 0 1px 0 rgba(255,255,255,' + (t.faceUp ? '0.7' : '0.2') + ');animation:wash' + t.wk + ' ' + t.washDur + 's ease-in-out ' + t.washDelay + 's infinite alternate';
        inner.innerHTML = faceArt(t);
        mid.appendChild(inner); outer.appendChild(mid); TILES!.appendChild(outer);
      }
      // wordmark rise
      LOCK_INNER!.style.animation = 'none'; void LOCK_INNER!.offsetWidth;
      LOCK_INNER!.style.animation = 'cmRise .6s ease-out ' + (intro ? '0.05s' : '0s') + ' both';
    }

    render(true); // cold launch: play the tumble-in once, then the wash loop
  }, []);

  // Keep on screen a minimum ~2.6s — long enough for the tumble-in to finish
  // (~1.1s) and the wash loop to breathe before it dismisses into the app.
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 2600);
    return () => clearTimeout(t);
  }, []);

  // Once the app is ready (and the minimum elapsed), begin the exit.
  useEffect(() => {
    if (ready && minElapsed) setExiting(true);
  }, [ready, minElapsed]);

  // Fade/scale out (~300ms), then dismiss.
  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(onDone, 300);
    return () => clearTimeout(t);
  }, [exiting, onDone]);

  return (
    <div ref={screenRef} className={`cmsplash${exiting ? ' cmsplash-exit' : ''}`} aria-hidden>
      <div className="felt-stripe" />
      <div className="felt-grain" />
      <div ref={tilesRef} className="cmsplash-tiles" />
      <div className="vignette" />
      <div className="cmsplash-lock">
        <div ref={lockInnerRef}>
          <div className="lock-club">CLUB</div>
          <div className="lock-mahj">Mahj</div>
          <div className="lock-cap">
            <span className="t">WASHING THE TILES</span>
            <span className="dots">
              <i style={{ animationDelay: '0s' }} />
              <i style={{ animationDelay: '.18s' }} />
              <i style={{ animationDelay: '.36s' }} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
