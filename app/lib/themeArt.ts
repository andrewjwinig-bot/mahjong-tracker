// Deterministic, seeded per-theme art for the App Theme picker cards. Pure
// functions → a `url("data:image/svg+xml,…")` string for background-image. Ported
// verbatim from the design handoff so the tiles match the app's header art.
// Filter ids are namespaced per theme so all 8 cards coexist without collisions.

import type { ThemeId } from './themePrefs';

const GROUND: Record<ThemeId, string> = {
  bam: '#1AA45C', dot: '#EAEFEA', crak: '#F2E8D6', dragon: '#0E4031',
  flower: '#F7DCE9', joker: '#6A3FC0', wind: '#E3EEEF', felt: '#1C5A3E',
};
const SEED: Record<ThemeId, number> = {
  bam: 11, dot: 7, crak: 5, dragon: 13, flower: 8, joker: 21, wind: 17, felt: 23,
};

const WHITE_HALO = '0 1px 0 rgba(255,255,255,0.9), 0 0 12px rgba(255,255,255,0.85)';

export interface CardToken {
  ground: string;
  name: string;
  shadow: string;
  scrim: 'dark' | 'light';
}

export const CARD_TOKENS: Record<ThemeId, CardToken> = {
  bam: { ground: GROUND.bam, name: '#FFFFFF', shadow: '2px 2px 0 #053219', scrim: 'dark' },
  dot: { ground: GROUND.dot, name: '#0A2A4E', shadow: WHITE_HALO, scrim: 'light' },
  crak: { ground: GROUND.crak, name: '#4D0F09', shadow: WHITE_HALO, scrim: 'light' },
  dragon: { ground: GROUND.dragon, name: '#FFFFFF', shadow: '2px 2px 0 #4C0D0B', scrim: 'dark' },
  flower: { ground: GROUND.flower, name: '#5C0A30', shadow: WHITE_HALO, scrim: 'light' },
  joker: { ground: GROUND.joker, name: '#FFFFFF', shadow: '2px 2px 0 #281451', scrim: 'dark' },
  wind: { ground: GROUND.wind, name: '#0E353C', shadow: WHITE_HALO, scrim: 'light' },
  felt: { ground: GROUND.felt, name: '#FFFFFF', shadow: '2px 2px 0 #0C3325', scrim: 'dark' },
};

export const SCRIM: Record<'dark' | 'light', string> = {
  dark: 'radial-gradient(circle at 50% 56%, rgba(0,0,0,0.32), rgba(0,0,0,0) 72%)',
  light: 'radial-gradient(circle at 50% 56%, rgba(255,255,255,0.52), rgba(255,255,255,0) 70%)',
};

function rng(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function star(cx: number, cy: number, r: number, inner: number) { let p = ''; for (let i = 0; i < 10; i++) { const rad = i % 2 ? inner : r; const a = Math.PI / 5 * i - Math.PI / 2; p += (i ? 'L' : 'M') + (cx + Math.cos(a) * rad).toFixed(1) + ',' + (cy + Math.sin(a) * rad).toFixed(1); } return p + 'Z'; }
function petal(cx: number, cy: number, rx: number, ry: number, rot: number) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"/>'; }

function fx(id: string, seed: number) { return '<filter id="rough_' + id + '" x="-25%" y="-25%" width="150%" height="150%"><feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="3" seed="' + seed + '" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="11" xChannelSelector="R" yChannelSelector="G"/></filter><filter id="roughBig_' + id + '" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="2" seed="' + (seed + 5) + '" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="20" xChannelSelector="R" yChannelSelector="G"/></filter><filter id="paper_' + id + '"><feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" seed="' + (seed + 9) + '"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.7"/></feComponentTransfer></filter>'; }

function art(id: string, ground: string) {
  const R = 'filter="url(#rough_' + id + ')"', RB = 'filter="url(#roughBig_' + id + ')"';
  switch (id) {
    case 'bam': { const stalk = (x: number, w: number, c: string) => '<rect x="' + x + '" y="-20" width="' + w + '" height="295" rx="' + (w / 2) + '" fill="' + c + '"/><rect x="' + (x - 6) + '" y="80" width="' + (w + 12) + '" height="9" rx="4" fill="' + c + '"/><rect x="' + (x - 6) + '" y="160" width="' + (w + 12) + '" height="9" rx="4" fill="' + c + '"/>'; const leaf = (x: number, y: number, rx: number, ry: number, rot: number, c: string) => '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + rot + ' ' + x + ' ' + y + ')" fill="' + c + '"/>'; return '<g ' + R + '>' + stalk(95, 28, '#0C3A24') + stalk(220, 22, '#0F4A2E') + stalk(342, 30, '#0C3A24') + '</g><g ' + R + '>' + leaf(152, 72, 60, 20, -32, '#C2F06A') + leaf(284, 120, 56, 19, 24, '#A6E04E') + leaf(106, 150, 54, 18, -20, '#C2F06A') + leaf(372, 90, 50, 17, 34, '#A6E04E') + '</g>'; }
    case 'dot': { const ring = (cx: number, cy: number, r: number, c: string, off?: boolean) => '<circle cx="' + (cx + (off ? 5 : 0)) + '" cy="' + (cy + (off ? 6 : 0)) + '" r="' + r + '" fill="none" stroke="' + c + '" stroke-width="20"/>'; return '<g ' + R + '><g opacity="0.5">' + [92, 62, 34].map((r) => ring(330, 94, r, '#F0883C', true)).join('') + '</g>' + [92, 62, 34].map((r) => ring(330, 94, r, '#1E6FCB')).join('') + '<circle cx="330" cy="94" r="16" fill="#15386E"/></g><g ' + R + ' opacity="0.9"><circle cx="116" cy="120" r="44" fill="none" stroke="#15386E" stroke-width="14"/><circle cx="116" cy="120" r="20" fill="none" stroke="#1E6FCB" stroke-width="12"/><circle cx="116" cy="120" r="5" fill="#F0883C"/></g>'; }
    case 'crak': { return '<g ' + RB + '><rect x="236" y="22" width="134" height="134" rx="16" fill="#C0392B"/><rect x="236" y="22" width="134" height="134" rx="16" fill="none" stroke="#7A1A12" stroke-width="5"/></g><g ' + R + ' stroke="' + ground + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M262 56 h80"/><path d="M303 56 v96"/><path d="M279 90 h48"/><path d="M279 120 h48"/><path d="M285 120 l-12 32 M321 120 l12 32"/></g><g ' + R + ' fill="#C0392B" opacity="0.5"><circle cx="116" cy="70" r="9"/><circle cx="150" cy="112" r="5"/><circle cx="96" cy="156" r="6"/></g>'; }
    case 'dragon': { const cx = 302, cy = 106; let burst = ''; for (let i = 0; i < 28; i++) { const a = Math.PI * 2 / 28 * i; const r1 = 44, r2 = (i % 2 ? 116 : 148); burst += '<line x1="' + (cx + Math.cos(a) * r1).toFixed(1) + '" y1="' + (cy + Math.sin(a) * r1).toFixed(1) + '" x2="' + (cx + Math.cos(a) * r2).toFixed(1) + '" y2="' + (cy + Math.sin(a) * r2).toFixed(1) + '" stroke="#E8C45A" stroke-width="' + (i % 2 ? 2 : 5) + '" opacity="' + (i % 2 ? 0.3 : 0.55) + '"/>'; } return '<g ' + R + '>' + burst + '</g><g ' + RB + '><circle cx="' + cx + '" cy="' + cy + '" r="40" fill="#F4E3A8"/><circle cx="' + cx + '" cy="' + cy + '" r="40" fill="none" stroke="#E8C45A" stroke-width="4"/><circle cx="' + (cx - 12) + '" cy="' + (cy - 12) + '" r="12" fill="#FFFFFF" opacity="0.55"/></g><g ' + R + ' fill="#C8302C" opacity="0.8"><path d="' + star(124, 90, 20, 9) + '"/></g>'; }
    case 'flower': { const bloom = (cx: number, cy: number, s: number, c1: string, c2: string) => '<g transform="translate(4,5)" opacity="0.32" fill="' + c2 + '">' + [0, 72, 144, 216, 288].map((a) => petal(cx, cy, 30 * s, 52 * s, a)).join('') + '</g><g fill="' + c1 + '">' + [0, 72, 144, 216, 288].map((a) => petal(cx, cy, 30 * s, 52 * s, a)).join('') + '</g><circle cx="' + cx + '" cy="' + cy + '" r="' + (20 * s).toFixed(1) + '" fill="#F4C84A"/>'; return '<g ' + R + ' fill="#2E8E5C" opacity="0.5">' + petal(76, 180, 30, 13, 40) + petal(362, 64, 30, 13, -30) + petal(252, 200, 28, 12, 15) + '</g><g ' + R + '>' + bloom(124, 92, 1.0, '#E2568F', '#C03B73') + bloom(302, 124, 0.85, '#F2934F', '#D9712F') + bloom(214, 56, 0.7, '#EA6FA8', '#C9518A') + '</g>'; }
    case 'joker': { const place = (x: number, y: number, rad: number, c: string) => '<path d="' + star(x + 5, y + 6, rad, rad * 0.42) + '" fill="#3A1E78" opacity="0.5"/><path d="' + star(x, y, rad, rad * 0.42) + '" fill="' + c + '"/>'; const r = rng(21); let sp = ''; for (let i = 0; i < 14; i++) { sp += '<circle cx="' + (r() * 440).toFixed(1) + '" cy="' + (r() * 228).toFixed(1) + '" r="' + (1 + r() * 3).toFixed(1) + '" fill="#FFFFFF" opacity="' + (0.4 + r() * 0.5).toFixed(2) + '"/>'; } return '<g ' + R + '>' + place(150, 98, 58, '#F4C84A') + place(324, 124, 40, '#FF6FA8') + place(254, 56, 28, '#3FD9D9') + place(374, 72, 22, '#EFE4FB') + '</g><g ' + R + '>' + sp + '</g>'; }
    case 'wind': { const cx = 322, cy = 94; let gusts = ''; for (let i = 0; i < 4; i++) { const y = 46 + i * 46; gusts += '<path d="M-30 ' + y + ' C 90 ' + (y - 24) + ', 220 ' + (y + 24) + ', 380 ' + (y - 10) + '" fill="none" stroke="#3E8C99" stroke-width="' + (i % 2 ? 5 : 9) + '" stroke-linecap="round" opacity="' + (0.26 + 0.1 * i).toFixed(2) + '"/>'; } const r = rng(17); let drift = ''; for (let i = 0; i < 10; i++) { const x = (r() * 420).toFixed(1), y = (18 + r() * 196).toFixed(1), rot = (r() * 180).toFixed(1); drift += '<g transform="rotate(' + rot + ' ' + x + ' ' + y + ')"><ellipse cx="' + x + '" cy="' + y + '" rx="9" ry="3.4" fill="#2E7D8C" opacity="0.4"/></g>'; } let arcs = ''; [34, 52, 72].forEach((rr, i) => { arcs += '<circle cx="' + cx + '" cy="' + cy + '" r="' + rr + '" fill="none" stroke="#7FB3BC" stroke-width="' + (5 - i) + '" opacity="' + (0.55 - i * 0.15).toFixed(2) + '" stroke-dasharray="' + (rr * 1.5).toFixed(0) + ' ' + (rr * 1.1).toFixed(0) + '"/>'; }); return '<g ' + R + '>' + gusts + '</g><g ' + R + '>' + drift + '</g><g ' + RB + '><circle cx="' + cx + '" cy="' + cy + '" r="42" fill="#2E7D8C"/><circle cx="' + cx + '" cy="' + cy + '" r="42" fill="none" stroke="#0A2E34" stroke-width="5"/></g><g ' + R + '>' + arcs + '</g><text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" font-family="Bricolage Grotesque,sans-serif" font-weight="800" font-size="48" fill="#EAF2F3">風</text>'; }
    case 'felt': { const tile = (x: number, y: number, rot: number, inner: string) => '<g transform="rotate(' + rot + ' ' + (x + 18) + ' ' + (y + 24) + ')"><rect x="' + x + '" y="' + y + '" width="36" height="48" rx="6" fill="#F7F2E3"/><rect x="' + x + '" y="' + y + '" width="36" height="48" rx="6" fill="none" stroke="#CFC4A6" stroke-width="2.5"/>' + inner + '</g>'; const dot = (x: number, y: number, c: string) => '<circle cx="' + (x + 18) + '" cy="' + (y + 24) + '" r="10" fill="none" stroke="' + c + '" stroke-width="4"/><circle cx="' + (x + 18) + '" cy="' + (y + 24) + '" r="3" fill="' + c + '"/>'; const bam = (x: number, y: number, c: string) => '<g fill="' + c + '"><rect x="' + (x + 11) + '" y="' + (y + 11) + '" width="5" height="26" rx="2.5"/><rect x="' + (x + 20) + '" y="' + (y + 11) + '" width="5" height="26" rx="2.5"/></g>'; let weave = ''; for (let i = -1; i < 9; i++) { const o = i * 56; weave += '<line x1="' + o + '" y1="-24" x2="' + (o + 264) + '" y2="240" stroke="#16553A" stroke-width="7" opacity="0.22"/>'; } return '<g ' + R + '>' + weave + '</g><g ' + RB + '>' + tile(74, 40, -9, dot(74, 40, '#2E86D4')) + tile(192, 26, 7, bam(192, 26, '#1F8A5B')) + tile(302, 52, -5, dot(302, 52, '#C0392B')) + tile(150, 150, 12, bam(150, 150, '#E0A21A')) + '</g>'; }
  }
  return '';
}

const cache: Partial<Record<ThemeId, string>> = {};

/** → a CSS `url(...)` ready for `background-image`. Memoized (deterministic). */
export function themeArt(id: ThemeId): string {
  if (cache[id]) return cache[id]!;
  const ground = GROUND[id], seed = SEED[id];
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 252" preserveAspectRatio="xMidYMid slice"><defs>' + fx(id, seed) + '</defs><rect width="440" height="252" fill="' + ground + '"/>' + art(id, ground) + '<rect width="440" height="252" filter="url(#paper_' + id + ')" opacity="0.08" style="mix-blend-mode:multiply"/></svg>';
  const uri = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  cache[id] = uri;
  return uri;
}
