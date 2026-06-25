// Club Mahj brand mark — the two stylized mahjong tiles that make up the logo,
// rebuilt as crisp vectors (the brand handoff was CSS-gradient only). A "bam-M"
// tile (three bamboo sticks shaped like an M) + a 6-petal "flower" tile, sitting
// in a slight fan. These carry the FIXED brand colors (not the theme tokens) so
// the mark always reads the same wherever it appears.
//
// Exports:
//   <BamTile/> <FlowerTile/>  — the individual tiles
//   <TileFan/>                — the two-tile fan (the core mark, no wordmark)
//   <BrandMono/>              — flat single-color bam-M silhouette (notifications)

// ---- brand palette (locked) ----------------------------------------------
const FACE_LIGHT = '#FFFFFF';
const FACE_MID = '#FBF7EC';
const FACE_DEEP = '#EBE2CE';
const TILE_BORDER = 'rgba(20,22,42,0.13)';
const BAM_EDGE = '#0C5026';
const BAM_MID = '#2BA45C';
const BAM_NODE = 'rgba(8,40,20,0.5)';
const PETAL_LIGHT = '#F9A8D4';
const PETAL_DEEP = '#DB2777';
const CORE_LIGHT = '#FBD37A';
const CORE_DEEP = '#E0941C';

// One tile is authored in a 120×152 portrait box; everything scales from there.
const TW = 120;
const TH = 152;

// Shared gradient + shadow defs. Stable ids — the defs are identical across
// instances, so duplicate ids on a page resolve harmlessly to the same paint.
function TileDefs() {
  return (
    <defs>
      <linearGradient id="cm-face" x1="0" y1="0" x2="1" y2="1.2">
        <stop offset="0" stopColor={FACE_LIGHT} />
        <stop offset="0.5" stopColor={FACE_MID} />
        <stop offset="1" stopColor={FACE_DEEP} />
      </linearGradient>
      <linearGradient id="cm-bam" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={BAM_EDGE} />
        <stop offset="0.48" stopColor={BAM_MID} />
        <stop offset="1" stopColor={BAM_EDGE} />
      </linearGradient>
      <linearGradient id="cm-petal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={PETAL_LIGHT} />
        <stop offset="1" stopColor={PETAL_DEEP} />
      </linearGradient>
      <radialGradient id="cm-core" cx="0.4" cy="0.35" r="0.7">
        <stop offset="0" stopColor={CORE_LIGHT} />
        <stop offset="1" stopColor={CORE_DEEP} />
      </radialGradient>
      <filter id="cm-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0C1E14" floodOpacity="0.32" />
      </filter>
    </defs>
  );
}

// The shared paper face (rounded mahjong-tile body), in local 120×152 space.
function TileFace() {
  return (
    <rect
      x="4"
      y="4"
      width={TW - 8}
      height={TH - 8}
      rx="16"
      fill="url(#cm-face)"
      stroke={TILE_BORDER}
      strokeWidth="2.4"
    />
  );
}

// Three vertical bamboo sticks — outer two tall, middle short → reads as an "M".
function BamMotif() {
  const bottom = 124;
  const cols = [
    { cx: 34, top: 46 }, // tall
    { cx: 60, top: 74 }, // short (the dip of the M)
    { cx: 86, top: 46 }, // tall
  ];
  // Node banding: tall sticks banded near 31% & 64%, short stick near 47%.
  const bands = (top: number, short: boolean) => {
    const h = bottom - top;
    const at = short ? [0.47] : [0.31, 0.64];
    return at.map((f) => top + h * f);
  };
  return (
    <g>
      {cols.map(({ cx, top }, i) => {
        const short = i === 1;
        return (
          <g key={cx}>
            <rect x={cx - 8} y={top} width="16" height={bottom - top} rx="8" fill="url(#cm-bam)" />
            {bands(top, short).map((y) => (
              <rect key={y} x={cx - 8} y={y - 1.6} width="16" height="3.4" rx="1.7" fill={BAM_NODE} />
            ))}
          </g>
        );
      })}
    </g>
  );
}

// 6 soft rounded petals around a gold core, rotated around the flower center.
function FlowerMotif() {
  return (
    <g>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse
          key={a}
          cx="60"
          cy="44"
          rx="13"
          ry="20"
          fill="url(#cm-petal)"
          transform={`rotate(${a} 60 76)`}
        />
      ))}
      <circle cx="60" cy="76" r="18" fill="url(#cm-core)" />
    </g>
  );
}

type TileProps = { size?: number; className?: string };

export function BamTile({ size = 88, className }: TileProps) {
  return (
    <svg
      width={size}
      height={(size * TH) / TW}
      viewBox={`0 0 ${TW} ${TH}`}
      className={className}
      aria-hidden
    >
      <TileDefs />
      <g filter="url(#cm-shadow)">
        <TileFace />
      </g>
      <BamMotif />
    </svg>
  );
}

export function FlowerTile({ size = 88, className }: TileProps) {
  return (
    <svg
      width={size}
      height={(size * TH) / TW}
      viewBox={`0 0 ${TW} ${TH}`}
      className={className}
      aria-hidden
    >
      <TileDefs />
      <g filter="url(#cm-shadow)">
        <TileFace />
      </g>
      <FlowerMotif />
    </svg>
  );
}

// The core mark: bam-M (back, tilted -11°) + flower (front, tilted +9°) fanned.
export function TileFan({ size = 132, className }: TileProps) {
  const VW = 240;
  const VH = 210;
  return (
    <svg
      width={size}
      height={(size * VH) / VW}
      viewBox={`0 0 ${VW} ${VH}`}
      className={className}
      role="img"
      aria-label="Club Mahj"
    >
      <TileDefs />
      <g filter="url(#cm-shadow)" transform="translate(16 18) rotate(-11 60 76)">
        <TileFace />
        <BamMotif />
      </g>
      <g filter="url(#cm-shadow)" transform="translate(108 30) rotate(9 60 76)">
        <TileFace />
        <FlowerMotif />
      </g>
    </svg>
  );
}

// Monochrome variant: flat single-color bam-M silhouette on transparent — for
// iOS template / Android status-bar notification icons. No gradients, one shape.
export function BrandMono({ size = 24, color = 'currentColor', className }: TileProps & { color?: string }) {
  const bottom = 96;
  const cols: [number, number][] = [
    [30, 30],
    [60, 54],
    [90, 30],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden>
      {cols.map(([cx, top]) => (
        <rect key={cx} x={cx - 11} y={top} width="22" height={bottom - top} rx="11" fill={color} />
      ))}
    </svg>
  );
}
