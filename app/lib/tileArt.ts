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
  | 'letter'; // a lettered tile (M / A / H / J)

const CRACK = '#E8455F';
const BAM = '#1FA85B';
const BAM_DK = '#0F7D42';
const DOT = '#2F80ED';
const GOLD = '#E59A2B';
const PURPLE = '#7C5CE0';
const NAVY = '#2C3A57';

const CJK = "'PingFang SC','Hiragino Sans GB','Heiti SC','Microsoft YaHei',sans-serif";

let jokerSeq = 0;

function dotMotif(): string {
  return `<circle cx="24" cy="31" r="13" fill="none" stroke="${DOT}" stroke-width="5"/>
    <circle cx="24" cy="31" r="4.5" fill="${DOT}"/>`;
}

function bamMotif(): string {
  const stick = (x: number) =>
    `<rect x="${x - 3}" y="17" width="6" height="28" rx="3" fill="${BAM}"/>
     <rect x="${x - 3}" y="29" width="6" height="2.6" fill="${BAM_DK}"/>`;
  return `${stick(15)}${stick(24)}${stick(33)}`;
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

function motifFor(face: TileFace, char?: string, color?: string): string {
  switch (face) {
    case 'dot':
      return dotMotif();
    case 'bam':
      return bamMotif();
    case 'flower':
      return flowerMotif();
    case 'joker':
      return jokerMotif();
    case 'crack':
      return charMotif('萬', CRACK);
    case 'wind':
      return charMotif(char ?? '東', NAVY);
    case 'dragon':
      return charMotif(char ?? '中', color ?? CRACK);
    case 'letter':
      return charMotif(char ?? 'M', color ?? CRACK, 30);
  }
}

export function tileSVG(face: TileFace, opts: { char?: string; color?: string } = {}): string {
  return `<svg viewBox="0 0 48 64" xmlns="http://www.w3.org/2000/svg" class="mj-svg">
    <rect class="mj-edge" x="2" y="4.5" width="44" height="57.5" rx="11"/>
    <rect class="mj-body" x="2" y="2" width="44" height="58" rx="11"/>
    <ellipse cx="24" cy="11" rx="19" ry="8.5" fill="#ffffff" fill-opacity="0.22"/>
    <ellipse cx="24" cy="57" rx="18" ry="5" fill="#000000" fill-opacity="0.05"/>
    ${motifFor(face, opts.char, opts.color)}
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
