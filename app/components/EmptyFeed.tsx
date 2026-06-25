'use client';

// Club Mahj — Feed empty state ("No mahjs called yet"). EXACT port of the
// Empty_State_Feed reference: four walls in a pinwheel/windmill layout build
// tile-by-tile clockwise (top L→R, right T→B, bottom R→L, left B→T), 0.045s
// stagger; once assembled (~1.25s) the two dice fade in and idle-bob. Glow
// pulses behind. Plays once on mount. Constants are verbatim.

import { useMemo } from 'react';

type Wall = { x: number; y: number; w: number; h: number; fx: number; fy: number };

function buildWalls(): Wall[] {
  const n = 5, step = 23.5, len = 22, dep = 26, box = 151, far = box - dep; // 125
  const w: Wall[] = [];
  for (let i = 0; i < n; i++) w.push({ x: 34 + i * step, y: 0, w: len, h: dep, fx: 0, fy: -22 }); // top  L→R
  for (let i = 0; i < n; i++) w.push({ x: far, y: 34 + i * step, w: dep, h: len, fx: 22, fy: 0 }); // right T→B
  for (let i = n - 1; i >= 0; i--) w.push({ x: i * step, y: far, w: len, h: dep, fx: 0, fy: 22 }); // bottom R→L
  for (let i = n - 1; i >= 0; i--) w.push({ x: 0, y: i * step, w: dep, h: len, fx: -22, fy: 0 }); // left B→T
  return w;
}

export default function EmptyFeed() {
  const tiles = useMemo(buildWalls, []);
  return (
    <div className="pw-card pw-card-feed">
      <div className="pw-seam" />
      <div className="pw-stage pw-stage-feed">
        <div className="pw-glow pw-glow-feed" />
        <div className="pw-field pw-field-feed">
          {tiles.map((t, idx) => (
            <div
              key={idx}
              className="pw-tile"
              style={{
                left: t.x,
                top: t.y,
                width: t.w,
                height: t.h,
                '--fx': `${t.fx}px`,
                '--fy': `${t.fy}px`,
                animation: `pwSlide 0.42s cubic-bezier(.2,.7,.3,1) ${(idx * 0.045).toFixed(3)}s both`,
              } as React.CSSProperties}
            />
          ))}
          {/* dice on top (rendered after the tiles) */}
          <div
            className="pw-die pw-die-feed"
            style={{
              left: 54,
              top: 58,
              '--dr': '-12deg',
              animation: 'pwDieIn .4s ease-out 1.25s forwards, pwDie 3s ease-in-out 1.25s infinite alternate',
            } as React.CSSProperties}
          >
            <span className="pw-pip" style={{ left: 4, top: 4, background: '#C0392B' }} />
            <span className="pw-pip" style={{ right: 4, top: 4, background: '#1A1410' }} />
            <span className="pw-pip" style={{ left: 4, bottom: 4, background: '#1A1410' }} />
            <span className="pw-pip" style={{ right: 4, bottom: 4, background: '#C0392B' }} />
          </div>
          <div
            className="pw-die pw-die-feed"
            style={{
              left: 80,
              top: 80,
              '--dr': '9deg',
              animation: 'pwDieIn .4s ease-out 1.4s forwards, pwDie 3s ease-in-out 1.4s infinite alternate',
            } as React.CSSProperties}
          >
            <span className="pw-pip" style={{ left: '50%', top: '50%', background: '#C0392B', transform: 'translate(-50%,-50%)' }} />
            <span className="pw-pip" style={{ left: 5, top: 5, background: '#1A1410' }} />
            <span className="pw-pip" style={{ right: 5, bottom: 5, background: '#1A1410' }} />
          </div>
        </div>
      </div>
      <div className="pw-title pw-title-feed">No mahjs called yet</div>
      <div className="pw-body pw-body-feed">
        The wall’s built and the dice are set — call <b>Mahj</b> on your Card and it’ll land right here for your crew.
      </div>
    </div>
  );
}
