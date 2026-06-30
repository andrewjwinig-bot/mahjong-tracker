// Custom mahjong tile artwork as inline SVG — one source of truth used by both
// the <Tile> React component and the confetti. The tile *body* uses themed CSS
// classes (.mj-body / .mj-edge) so tiles reskin with the theme; the suit motifs
// keep their canonical colors so a crack always reads as a crack.

export type TileFace =
  | 'crack' // 萬 character / "wan"
  | 'bam' // bamboo
  | 'dot' // circle / "bing"
  | 'flower'
  | 'wind'
  | 'dragon'
  | 'joker'
  | 'letter' // a lettered tile (M / A / H / J)
  | 'icon' // illustrated mahjong icon (key carried in `char`), see tileIcons.ts
  | 'motif'; // hand-drawn motif PNG (key in `char`, color in `color`), see /tile-motifs

import { BAMBOO_LETTERS } from './bambooLetters';
import { TILE_ICONS } from './tileIcons';

const CRACK = '#E8455F';
const BAM = '#1FA85B';
const BAM_DK = '#0F7D42';
const DOT = '#2F80ED';
const GOLD = '#E59A2B';
const PURPLE = '#7C5CE0';
const NAVY = '#2C3A57';

const CJK = "'PingFang SC','Hiragino Sans GB','Heiti SC','Microsoft YaHei',sans-serif";

let jokerSeq = 0;
let gradSeq = 0;

// Mix two #rrggbb hex colors in sRGB (matches CSS color-mix(in srgb)).
function mixHex(a: string, b: string, aPct: number): string {
  const pa = aPct / 100;
  const pb = 1 - pa;
  const ca = parseInt(a.slice(1), 16);
  const cb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => {
    const va = (ca >> sh) & 255;
    const vb = (cb >> sh) & 255;
    return Math.round(va * pa + vb * pb);
  };
  const to2 = (n: number) => n.toString(16).padStart(2, '0');
  return `#${to2(ch(16))}${to2(ch(8))}${to2(ch(0))}`;
}

// The monogram as a real bamboo letterform (A–Z), tinted by the tile color with
// a subtle vertical depth gradient. Non A–Z chars fall back to a plain glyph.
function letterMotif(char: string | undefined, color: string): string {
  const raw = (char ?? 'M').trim().toUpperCase();
  const L = /^[A-Z]$/.test(raw) ? BAMBOO_LETTERS[raw] : undefined;
  if (!L) return charMotif(raw || 'M', color, 30);
  const id = `bmb${gradSeq++}`;
  const top = mixHex(color, '#ffffff', 82);
  const bot = mixHex(color, '#06301b', 80);
  // Centered bamboo glyph box inside the 48×64 tile, optically nudged right.
  return `<defs><linearGradient id="${id}" x1="0.18" y1="0" x2="0.82" y2="1">
      <stop offset="0" stop-color="${top}"/>
      <stop offset="0.48" stop-color="${color}"/>
      <stop offset="1" stop-color="${bot}"/>
    </linearGradient></defs>
    <svg x="9.5" y="11" width="29" height="40" viewBox="${L.vb}" preserveAspectRatio="xMidYMid meet">
      <path d="${L.d}" fill="url(#${id})" fill-rule="evenodd"/>
    </svg>`;
}

// Which icons recolor to the chosen tile color: `true` = every path along a
// dark→light ramp of the color; an array = only those path indices.
const ICON_TINT: Record<string, true | number[]> = {
  red_dragon_curled: true,
  bamboo_sprig: true,
  character_wan: true,
  green_dragon: true,
  red_dragon: true,
  bird: [0], // body tints; red crest stays fixed
  joker: true,
  pink_flower: [1], // center dot only
};
// Per-icon zoom (shrinks the viewBox around center so the art renders larger).
const ICON_SCALE: Record<string, number> = { red_dragon_curled: 1.08, bamboo_sprig: 1.18, bird: 1.06 };
const TONE_SPREAD = 1.32;

function relLum(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// An illustrated mahjong icon (key in `char`), tinted toward the chosen color.
function iconMotif(key: string | undefined, color: string): string {
  const ic = key ? TILE_ICONS[key] : undefined;
  if (!ic) return charMotif('?', color, 26);
  const tint = key ? ICON_TINT[key] : undefined;
  let ramp: Record<string, string> | null = null;
  if (tint) {
    const uniq = [...new Set(ic.paths.map((p) => p.fill))].sort((a, b) => relLum(a) - relLum(b));
    const n = uniq.length;
    ramp = {};
    uniq.forEach((f, i) => {
      const pos = n === 1 ? 0.5 : i / (n - 1);
      ramp![f] =
        pos < 0.5
          ? mixHex(color, '#06150e', (1 - (0.5 - pos) * TONE_SPREAD) * 100)
          : mixHex(color, '#ffffff', (1 - (pos - 0.5) * TONE_SPREAD) * 100);
    });
  }
  const tintPath = (i: number) => tint === true || (Array.isArray(tint) && tint.indexOf(i) !== -1);
  const body = ic.paths
    .map((p, i) => `<path d="${p.d}" fill="${ramp && tintPath(i) ? ramp[p.fill] : p.fill}" fill-rule="${p.fr}"/>`)
    .join('');
  // Apply per-icon zoom by shrinking the viewBox around its center.
  let vb = ic.vb;
  const s = ICON_SCALE[key ?? ''];
  if (s && s !== 1) {
    const [mx, my, w, h] = ic.vb.split(/\s+/).map(Number);
    const w2 = w / s;
    const h2 = h / s;
    vb = `${mx + (w - w2) / 2} ${my + (h - h2) / 2} ${w2} ${h2}`;
  }
  // Fill most of the tile body, centered.
  return `<svg x="6" y="6" width="36" height="52" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}

function dotMotif(): string {
  return `<circle cx="24" cy="31" r="13" fill="none" stroke="${DOT}" stroke-width="5"/>
    <circle cx="24" cy="31" r="4.5" fill="${DOT}"/>`;
}

// A single ornate "circle" dot (concentric ring + core), like the 1-dot tile.
function ringDot(cx: number, cy: number, r: number, color: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${(r * 0.42).toFixed(1)}"/>
    <circle cx="${cx}" cy="${cy}" r="${(r * 0.34).toFixed(1)}" fill="${color}"/>`;
}

// Canonical 1–9 pip arrangements (shared by dot circles and bamboo sticks).
function pipPositions(n: number): [number, number][] {
  const C = { L: 14, M: 24, R: 34 };
  const R = { T: 20, M: 31, B: 42 };
  const layouts: Record<number, [number, number][]> = {
    1: [[C.M, R.M]],
    2: [[C.M, R.T], [C.M, R.B]],
    3: [[C.L, R.T], [C.M, R.M], [C.R, R.B]],
    4: [[C.L, R.T], [C.R, R.T], [C.L, R.B], [C.R, R.B]],
    5: [[C.L, R.T], [C.R, R.T], [C.M, R.M], [C.L, R.B], [C.R, R.B]],
    6: [[C.L, R.T], [C.R, R.T], [C.L, R.M], [C.R, R.M], [C.L, R.B], [C.R, R.B]],
    7: [[C.L, R.T], [C.M, R.T], [C.R, R.T], [C.M, R.M], [C.L, R.B], [C.M, R.B], [C.R, R.B]],
    8: [[C.L, R.T], [C.R, R.T], [C.L, R.M], [C.R, R.M], [C.L, R.B], [C.R, R.B], [C.M, 25.5], [C.M, 36.5]],
    9: [[C.L, R.T], [C.M, R.T], [C.R, R.T], [C.L, R.M], [C.M, R.M], [C.R, R.M], [C.L, R.B], [C.M, R.B], [C.R, R.B]],
  };
  return layouts[Math.max(1, Math.min(9, Math.round(n)))];
}

// An n-dot ("bing") tile: 1–9 circles. Also used for festive leaderboard ranks.
function dotsMotif(count: number, color = DOT): string {
  const n = Math.max(1, Math.min(9, Math.round(count)));
  if (n === 1) return ringDot(24, 31, 13, color);
  const r = n <= 4 ? 5 : 4.2;
  return pipPositions(n).map(([x, y]) => ringDot(x, y, r, color)).join('');
}

// Default bamboo tile (canonical 3-stick look) when no value is given.
function bamMotif(): string {
  const stick = (x: number) =>
    `<rect x="${x - 3}" y="17" width="6" height="28" rx="3" fill="${BAM}"/>
     <rect x="${x - 3}" y="29" width="6" height="2.6" fill="${BAM_DK}"/>`;
  return `${stick(15)}${stick(24)}${stick(33)}`;
}

// An n-bam tile: 1–9 bamboo sticks in the canonical pip arrangement.
function bamsMotif(count: number): string {
  const n = Math.max(1, Math.min(9, Math.round(count)));
  const h = n <= 4 ? 13 : 9;
  const w = n <= 4 ? 4.6 : 3.8;
  const stick = (x: number, y: number) =>
    `<rect x="${(x - w / 2).toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${w}" height="${h}" rx="${(w / 2).toFixed(1)}" fill="${BAM}"/>
     <rect x="${(x - w / 2).toFixed(1)}" y="${(y - 1).toFixed(1)}" width="${w}" height="2" fill="${BAM_DK}"/>`;
  return pipPositions(n).map(([x, y]) => stick(x, y)).join('');
}

// A numbered character ("crak") tile: the digit over 萬.
function crakValueMotif(value: number): string {
  return `<text x="24" y="21" text-anchor="middle" dominant-baseline="central"
      font-size="18" font-weight="800" fill="${NAVY}" font-family="var(--font-display), ${CJK}">${value}</text>
    <text x="24" y="41" text-anchor="middle" dominant-baseline="central"
      font-size="17" font-weight="800" fill="${CRACK}" font-family="${CJK}">萬</text>`;
}

function flowerMotif(): string {
  let petals = '';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const px = 24 + Math.cos(a) * 11;
    const py = 31 + Math.sin(a) * 11;
    petals += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" fill="${i % 2 ? PURPLE : CRACK}"/>`;
  }
  return `${petals}<circle cx="24" cy="31" r="6.5" fill="${GOLD}"/>`;
}

function jokerMotif(): string {
  const id = `jok${jokerSeq++}`;
  // five-point star
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const outer = i * 2;
    const aO = (Math.PI / 5) * outer - Math.PI / 2;
    pts.push(`${(24 + Math.cos(aO) * 15).toFixed(1)},${(31 + Math.sin(aO) * 15).toFixed(1)}`);
    const aI = (Math.PI / 5) * (outer + 1) - Math.PI / 2;
    pts.push(`${(24 + Math.cos(aI) * 6.5).toFixed(1)},${(31 + Math.sin(aI) * 6.5).toFixed(1)}`);
  }
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${CRACK}"/>
      <stop offset="0.5" stop-color="${GOLD}"/>
      <stop offset="1" stop-color="${PURPLE}"/>
    </linearGradient></defs>
    <polygon points="${pts.join(' ')}" fill="url(#${id})" stroke="${NAVY}" stroke-width="1.5" stroke-linejoin="round"/>`;
}

function charMotif(char: string, color: string, size = 30): string {
  return `<text x="24" y="31" text-anchor="middle" dominant-baseline="central"
    font-size="${size}" font-weight="800" fill="${color}"
    font-family="${color === CRACK || color === NAVY ? CJK : `var(--font-display), ${CJK}`}">${char}</text>`;
}

// The 14 hand-drawn motif tiles, recolored via pre-baked per-color PNGs.
// `color` is a solid hex or 'multi' (the original multicolor artwork).
const MOTIF_SOLIDS = new Set(['#15803D', '#C0392B', '#3B6FE0', '#6A3FC0', '#E0A21B', '#2E7D5B', '#14162A']);
export function motifSrc(key: string, color?: string): string {
  const hex = (color ?? '').toUpperCase();
  const suffix = color && color !== 'multi' && MOTIF_SOLIDS.has(hex) ? `__${hex.slice(1)}` : '';
  return `/tile-motifs/${key}${suffix}.png`;
}
function motifImage(key: string | undefined, color: string): string {
  if (!key) return charMotif('?', color, 26);
  // Centered in the tile body, leaving a little breathing room.
  return `<image href="${motifSrc(key, color)}" x="6" y="6.5" width="36" height="51" preserveAspectRatio="xMidYMid meet"/>`;
}

// A clean Latin letter-glyph tile (winds + dragons) in the display font, so
// N/E/W/S and R/G all read the same — the "newer" approachable style.
function glyphLetter(letter: string, color: string): string {
  return `<text x="24" y="31" text-anchor="middle" dominant-baseline="central"
    font-size="30" font-weight="800" fill="${color}"
    font-family="var(--font-display), system-ui, sans-serif">${letter}</text>`;
}

// Winds render as the Western N/E/W/S letters, translating any legacy CJK chars
// so every call site stays consistent.
const WIND_LETTER: Record<string, string> = {
  '東': 'E', '南': 'S', '西': 'W', '北': 'N',
  E: 'E', S: 'S', W: 'W', N: 'N',
};
function windMotif(char?: string): string {
  const key = char ?? 'E';
  return glyphLetter(WIND_LETTER[key] ?? key, NAVY);
}

// The classic Western "soap" — a double rounded frame — for the white dragon.
function soapMotif(): string {
  return `<rect x="13" y="16.5" width="22" height="29" rx="5" fill="none" stroke="${DOT}" stroke-width="3.2"/>
    <rect x="18.5" y="22" width="11" height="18" rx="3" fill="none" stroke="${DOT}" stroke-width="2"/>`;
}

// Dragons render in the approachable Western style: a red "R", a green "G", and
// the blue "soap" for white — no CJK glyphs. Legacy chars 中/發/白 map across
// automatically; any other char (e.g. the year "0" in a card decode) falls back
// to a plain glyph.
function dragonMotif(char?: string, color?: string): string {
  if (char === '發' || char === 'G') return glyphLetter('G', color ?? BAM);
  if (char === '白' || char === 'P') return soapMotif();
  if (char == null || char === '中' || char === 'R') return glyphLetter('R', color ?? CRACK);
  return charMotif(char, color ?? CRACK);
}

function motifFor(face: TileFace, char?: string, color?: string, count?: number): string {
  switch (face) {
    case 'dot':
      return count != null ? dotsMotif(count, color) : dotMotif();
    case 'bam':
      return count != null ? bamsMotif(count) : bamMotif();
    case 'flower':
      return flowerMotif();
    case 'joker':
      return jokerMotif();
    case 'crack':
      return count != null ? crakValueMotif(count) : charMotif('萬', CRACK);
    case 'wind':
      return windMotif(char);
    case 'dragon':
      return dragonMotif(char, color);
    case 'letter':
      return letterMotif(char, !color || color === 'multi' ? '#15803D' : color);
    case 'icon':
      return iconMotif(char, color ?? BAM_DK);
    case 'motif':
      return motifImage(char, color ?? 'multi');
  }
}

export function tileSVG(
  face: TileFace,
  opts: { char?: string; color?: string; count?: number } = {},
): string {
  return `<svg viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg" class="mj-svg">
    <rect class="mj-edge" x="2" y="4.5" width="44" height="57.5" rx="11"/>
    <rect class="mj-body" x="2" y="2" width="44" height="58" rx="11"/>
    <ellipse cx="24" cy="11" rx="19" ry="8.5" fill="#ffffff" fill-opacity="0.22"/>
    <ellipse cx="24" cy="57" rx="18" ry="5" fill="#000000" fill-opacity="0.05"/>
    ${motifFor(face, opts.char, opts.color, opts.count)}
  </svg>`;
}

/** Just the tile's art (motif only, no tile body) as a standalone SVG — used
 *  to echo a user's avatar on small decorative surfaces like the scatter tiles. */
export function tileArtSVG(
  face: TileFace,
  opts: { char?: string; color?: string; count?: number } = {},
): string {
  return `<svg viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
    ${motifFor(face, opts.char, opts.color, opts.count)}
  </svg>`;
}

/** Faces used for celebratory confetti — real mahjong tiles only. */
export const CONFETTI_FACES: { face: TileFace; char?: string; color?: string }[] = [
  { face: 'crack' },
  { face: 'bam' },
  { face: 'dot' },
  { face: 'flower' },
  { face: 'dragon', char: '中', color: CRACK },
  { face: 'dragon', char: '發', color: BAM },
  { face: 'dragon', char: '白', color: DOT },
  { face: 'wind', char: '東' },
  { face: 'wind', char: '南' },
  { face: 'joker' },
];
