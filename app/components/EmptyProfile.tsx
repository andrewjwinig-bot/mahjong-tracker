'use client';

// Club Mahj — Profile empty state ("No games yet"). EXACT port of the
// Empty_State_Profile reference: the same green tiles + a die, but scattered
// flat (uniform size, collision-avoided, no overlaps) in a 168×124 box. Tiles
// toss out from the cluster center and settle (center-first by distance), then
// the die fades in and idle-bobs. Seeded RNG (seed 71) → identical scatter.
// Plays once on mount. Constants + seed are verbatim.

import { useMemo } from 'react';

type Scatter = { x: number; y: number; w: number; h: number; rot: number; dx: number; dy: number; tr0: number; delay: string };

function buildScatter(): Scatter[] {
  let seed = 71;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const Wb = 168, Hb = 124, N = 14, gap = 3;
  const placed: { cx: number; cy: number; bw: number; bh: number }[] = [];
  const out: Scatter[] = [];
  let tries = 0;
  while (out.length < N && tries < 1200) {
    tries++;
    const w = 20, h = 25;                                   // uniform tile size
    const rot = Math.round((rnd() - 0.5) * 64);
    const rad = Math.abs(rot * Math.PI / 180);
    const bw = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad));
    const bh = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
    const cx = bw / 2 + rnd() * (Wb - bw);
    const cy = bh / 2 + rnd() * (Hb - bh);
    if (Math.abs(cx - Wb / 2) < 20 && Math.abs(cy - Hb / 2) < 20) continue;   // keep center clear for the die
    let hit = false;
    for (const p of placed) {
      if (Math.abs(cx - p.cx) < (bw + p.bw) / 2 + gap && Math.abs(cy - p.cy) < (bh + p.bh) / 2 + gap) { hit = true; break; }
    }
    if (hit) continue;
    placed.push({ cx, cy, bw, bh });
    const dx = (Wb / 2 - cx) * 0.7, dy = (Hb / 2 - cy) * 0.7;
    const tr0 = rot + (rnd() - 0.5) * 240;
    const dist = Math.sqrt((cx - Wb / 2) * (cx - Wb / 2) + (cy - Hb / 2) * (cy - Hb / 2));
    const delay = (dist / 110 * 0.45 + rnd() * 0.08).toFixed(3);
    out.push({ x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w, h, rot, dx, dy, tr0, delay });
  }
  return out;
}

export default function EmptyProfile() {
  const tiles = useMemo(buildScatter, []);
  return (
    <div className="pw-card pw-card-profile">
      <div className="pw-seam" />
      <div className="pw-stage pw-stage-profile">
        <div className="pw-glow pw-glow-profile" />
        <div className="pw-field pw-field-profile">
          {tiles.map((t, idx) => (
            <div
              key={idx}
              className="pw-tile"
              style={{
                left: t.x,
                top: t.y,
                width: t.w,
                height: t.h,
                transform: `rotate(${t.rot}deg)`,
                transformOrigin: 'center',
                '--tx': `${t.dx.toFixed(0)}px`,
                '--ty': `${t.dy.toFixed(0)}px`,
                '--tr0': `${t.tr0.toFixed(0)}deg`,
                '--rf': `${t.rot}deg`,
                animation: `pwToss 0.5s cubic-bezier(.2,.72,.3,1.06) ${t.delay}s both`,
              } as React.CSSProperties}
            />
          ))}
          {/* die on top */}
          <div className="pw-die pw-die-profile" style={{ '--dr': '-10deg' } as React.CSSProperties}>
            <span className="pw-pip" style={{ left: '50%', top: '50%', background: '#C0392B', transform: 'translate(-50%,-50%)' }} />
            <span className="pw-pip" style={{ left: 5, top: 5, background: '#1A1410' }} />
            <span className="pw-pip" style={{ right: 5, bottom: 5, background: '#1A1410' }} />
          </div>
        </div>
      </div>
      <div className="pw-title pw-title-profile">No games yet</div>
      <div className="pw-body pw-body-profile">
        Log your first <b>hand</b> and your season starts filling in.
      </div>
    </div>
  );
}
