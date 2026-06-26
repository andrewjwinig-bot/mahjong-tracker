// Club Mahj brand mark — built from two stylized mahjong tiles (no external
// art): a bam-"M" tile (three bamboo sticks) + a 6-petal flower tile. All
// gradients are reproduced as SVG so the mark stays crisp at any size and can
// feed the app icon. See `Club Mahj - Logo.dc.html`.

import type { CSSProperties } from 'react';

// --- A single paper tile face (shared base) --------------------------------
function tileDefs(id: string) {
  return (
    <defs>
      <linearGradient id={`${id}-face`} x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(67 .5 .5)">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.5" stopColor="#FBF7EC" />
        <stop offset="1" stopColor="#EBE2CE" />
      </linearGradient>
      <linearGradient id={`${id}-bam`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#0C5026" />
        <stop offset="0.48" stopColor="#2BA45C" />
        <stop offset="1" stopColor="#0C5026" />
      </linearGradient>
      <linearGradient id={`${id}-petal`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F9A8D4" />
        <stop offset="1" stopColor="#DB2777" />
      </linearGradient>
      <radialGradient id={`${id}-center`} cx="0.4" cy="0.35" r="0.7">
        <stop offset="0" stopColor="#FBD37A" />
        <stop offset="1" stopColor="#E0941C" />
      </radialGradient>
    </defs>
  );
}

/** Bamboo "M" tile — outer sticks tall, middle short, banded nodes. */
export function BamTile({ size = 120, rotate = 0, style }: { size?: number; rotate?: number; style?: CSSProperties }) {
  // viewBox 100×125 tile; sticks bottom-aligned at y=104.
  const node = (x: number, y: number) => (
    <rect x={x - 7} y={y} width={14} height={3.2} rx={1.6} fill="rgba(8,40,20,0.5)" />
  );
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 100 125" style={style} aria-hidden>
      {tileDefs('bam')}
      <g transform={`rotate(${rotate} 50 62)`}>
        <rect x="6" y="6" width="88" height="113" rx="16" fill="url(#bam-face)" stroke="rgba(20,22,42,0.13)" strokeWidth="2.4" />
        {/* three sticks: x=28,50,72 ; bottom y=104 ; outer h=72 (top 32), mid h=46 (top 58) */}
        {[28, 72].map((x) => (
          <g key={x}>
            <rect x={x - 6} y={32} width={12} height={72} rx={6} fill="url(#bam-bam)" />
            {node(x, 53)}
            {node(x, 80)}
          </g>
        ))}
        <g>
          <rect x={50 - 6} y={58} width={12} height={46} rx={6} fill="url(#bam-bam)" />
          {node(50, 79)}
        </g>
      </g>
    </svg>
  );
}

/** 6-petal flower tile. */
export function FlowerTile({ size = 120, rotate = 0, style }: { size?: number; rotate?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 100 125" style={style} aria-hidden>
      {tileDefs('flower')}
      <g transform={`rotate(${rotate} 50 62)`}>
        <rect x="6" y="6" width="88" height="113" rx="16" fill="url(#flower-face)" stroke="rgba(20,22,42,0.13)" strokeWidth="2.4" />
        <g transform="translate(50 62)">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <ellipse key={deg} cx="0" cy="-20" rx="11" ry="17" fill="url(#flower-petal)" transform={`rotate(${deg})`} />
          ))}
          <circle cx="0" cy="0" r="11" fill="url(#flower-center)" />
        </g>
      </g>
    </svg>
  );
}

/** The two tiles fanned (bam -11°, flower +9°) — the core mark, no wordmark. */
export function BrandFan({ size = 160 }: { size?: number }) {
  const t = size * 0.5; // tile width; slight overlap keeps both tiles legible
  const shadow = 'drop-shadow(0 8px 14px rgba(0,0,0,0.28))';
  return (
    <div style={{ position: 'relative', width: size, height: size * 0.86 }}>
      <BamTile size={t} rotate={-11} style={{ position: 'absolute', left: '3%', top: '9%', filter: shadow }} />
      <FlowerTile size={t} rotate={9} style={{ position: 'absolute', right: '3%', top: 0, filter: shadow }} />
    </div>
  );
}

/** Stacked CLUB / Mahj wordmark. Shadow color is surface-dependent. */
export function BrandWordmark({ surface = 'felt' }: { surface?: 'felt' | 'paper' | 'ko' }) {
  const ink = surface === 'paper' ? '#1A1410' : surface === 'ko' ? '#F0EADB' : '#FFFFFF';
  const club = surface === 'paper' ? '#15803D' : surface === 'ko' ? '#F0EADB' : '#F5D58A';
  const shadow = surface === 'felt' ? '#0C3325' : surface === 'paper' ? '#DB2777' : null;
  return (
    <div style={{ textAlign: 'center', lineHeight: 1 }}>
      <div
        style={{
          fontFamily: 'var(--font-app), system-ui, sans-serif',
          fontWeight: 800,
          fontSize: '0.34em',
          letterSpacing: '0.5em',
          textIndent: '0.5em',
          color: club,
        }}
      >
        CLUB
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontWeight: 800,
          fontSize: '1em',
          letterSpacing: '-0.04em',
          color: ink,
          textShadow: shadow ? `0.05em 0.05em 0 ${shadow}` : 'none',
        }}
      >
        Mahj
      </div>
    </div>
  );
}

/** Primary lockup — fanned tiles above the stacked wordmark (for splash/header). */
export function BrandLockup({
  scale = 1,
  surface = 'felt',
  tagline = false,
}: {
  scale?: number;
  surface?: 'felt' | 'paper' | 'ko';
  tagline?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 * scale, fontSize: `${64 * scale}px` }}>
      <BrandFan size={150 * scale} />
      <BrandWordmark surface={surface} />
      {tagline && (
        <div
          style={{
            fontFamily: 'var(--font-app), system-ui, sans-serif',
            fontWeight: 600,
            fontSize: 16 * scale,
            color: surface === 'paper' ? '#5C7367' : '#A9C6B5',
          }}
        >
          Your mahj crew, all in one place.
        </div>
      )}
    </div>
  );
}
