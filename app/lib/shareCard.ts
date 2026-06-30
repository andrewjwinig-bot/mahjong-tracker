// Generates a downloadable "share card" PNG for a win — the artifact whose
// usage is the headline Phase-1 metric. Drawn on a 4:5 canvas (social-friendly).

import { COLORS, colorNotation } from './theme';
import type { Win } from './types';
import { getAccount } from './account';

const W = 1080;
const H = 1350;

// Fixed "felt & paper" v6 palette for the shareable artifact (not theme-reactive).
const SC_BRAND = '#C0392B';
const SC_BRAND_DEEP = '#4D0F09';
const SC_CREAM = '#FBF7EC';
const SC_INK = '#1A1410';
// Fixed 4-color hand-notation palette (nc0–nc3).
const SC_NOTE: Record<string, string> = {
  nc0: '#1A1410',
  nc1: '#C0392B',
  nc2: '#C9871A',
  nc3: '#2E86D4',
};
const RND = 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif';

export async function buildShareCard(win: Win, handLabel: string | null): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Cream paper card background.
  ctx.fillStyle = SC_CREAM;
  ctx.fillRect(0, 0, W, H);

  // Brand header band with diagonal stripes.
  const bandH = 210;
  ctx.fillStyle = SC_BRAND;
  ctx.fillRect(0, 0, W, bandH);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, bandH);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 7;
  for (let i = -H; i < W; i += 46) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + bandH, bandH);
    ctx.stroke();
  }
  ctx.restore();
  // Club Mahj wordmark lockup: "CLUB" letterspaced over a big "Mahj", with a
  // "2026 SEASON" tag beneath — the same brand lockup used across the app.
  const lctx = ctx as CanvasRenderingContext2D & { letterSpacing: string };
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.font = `800 30px ${RND}`;
  lctx.letterSpacing = '7px';
  ctx.fillText('CLUB', 66, 70);
  lctx.letterSpacing = '0px';
  ctx.font = `900 76px ${RND}`;
  ctx.fillStyle = SC_BRAND_DEEP;
  ctx.fillText('Mahj', 68, 150);
  ctx.fillStyle = '#fff';
  ctx.fillText('Mahj', 64, 146);
  ctx.font = `800 24px ${RND}`;
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  lctx.letterSpacing = '5px';
  ctx.fillText('2026 SEASON', 66, 188);
  lctx.letterSpacing = '0px';

  // A 中 paper tile on the right of the band (design frame 7).
  drawTile(ctx, W - 176, 40, 110, 138, -6, '中', SC_BRAND, 56);

  let cursorY = bandH + 120;
  const pad = 72;

  // A couple of scattered corner tiles, faintly behind the headline.
  drawTile(ctx, 28, bandH + 30, 96, 122, -15, '發', '#2E86D4', 48);
  drawTile(ctx, W - 130, bandH + 24, 96, 122, 13, '中', SC_BRAND, 48);

  // Two-tone "I GOT MAHJ!" headline (centered).
  ctx.textAlign = 'center';
  ctx.font = `900 96px ${RND}`;
  ctx.fillStyle = SC_BRAND_DEEP;
  ctx.fillText('I GOT MAHJ!', W / 2 + 6, cursorY + 6);
  ctx.fillStyle = SC_BRAND;
  ctx.fillText('I GOT MAHJ!', W / 2, cursorY);
  cursorY += 70;

  // Photo (optional) — framed.
  if (win.photo) {
    const img = await blobToImage(win.photo);
    const photoH = 540;
    ctx.save();
    roundRect(ctx, pad, cursorY, W - pad * 2, photoH, 28);
    ctx.clip();
    drawCover(ctx, img, pad, cursorY, W - pad * 2, photoH);
    ctx.restore();
    ctx.strokeStyle = 'rgba(20,22,42,0.12)';
    ctx.lineWidth = 5;
    roundRect(ctx, pad, cursorY, W - pad * 2, photoH, 28);
    ctx.stroke();
    cursorY += photoH + 70;
  } else {
    cursorY += 30;
  }

  // Winning hand in fixed 4-color notation (centered).
  drawNotation(ctx, colorNotation(handLabel ?? 'Mahjong!'), W / 2, cursorY, `900 60px ${RND}`);
  cursorY += 80;

  // Note (optional, centered).
  if (win.note) {
    ctx.fillStyle = '#4a4f5e';
    ctx.font = `600 34px ${RND}`;
    ctx.fillText(`“${win.note}”`, W / 2, cursorY);
    cursorY += 50;
  }

  // Footer: a hairline rule, then "DATE · @handle" on the left and three mini
  // suit tiles on the right (design frame 7).
  const footY = H - 96;
  ctx.strokeStyle = 'rgba(20,22,42,0.10)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(pad, footY - 36);
  ctx.lineTo(W - pad, footY - 36);
  ctx.stroke();

  const date = new Date(win.createdAt)
    .toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase();
  const handle = getAccount()?.username?.trim().toLowerCase().replace(/\s+/g, '');
  ctx.fillStyle = COLORS.muted;
  ctx.font = `700 30px ${RND}`;
  ctx.textAlign = 'left';
  ctx.fillText(handle ? `${date} · @${handle}` : date, pad, footY);

  // Three mini suit tiles, right-aligned.
  const mt = 50;
  const mh = 64;
  const gap = 10;
  let mx = W - pad - mt * 3 - gap * 2;
  drawTile(ctx, mx, footY - mh + 22, mt, mh, 0, '萬', SC_BRAND, 28);
  mx += mt + gap;
  drawTile(ctx, mx, footY - mh + 22, mt, mh, 0, '發', '#15803D', 28);
  mx += mt + gap;
  drawTile(ctx, mx, footY - mh + 22, mt, mh, 0, null, SC_NOTE.nc3, 28);

  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? new Blob()), 'image/png'),
  );
}

// Draw position-cycled 4-color notation, centered on cx.
function drawNotation(
  ctx: CanvasRenderingContext2D,
  groups: { text: string; cls: string }[],
  cx: number,
  y: number,
  font: string,
): void {
  ctx.font = font;
  ctx.textAlign = 'left';
  const space = ctx.measureText(' ').width;
  let total = 0;
  for (const g of groups) total += ctx.measureText(g.text).width + space;
  total = Math.max(0, total - space);
  let x = cx - total / 2;
  for (const g of groups) {
    ctx.fillStyle = SC_NOTE[g.cls] ?? SC_INK;
    ctx.fillText(g.text, x, y);
    x += ctx.measureText(g.text).width + space;
  }
}

export interface TrophyCardData {
  name: string;
  cleared: number;
  total: number;
  mahjs: number;
  points: number;
  bestStreak: number;
  earned: number;
  totalBadges: number;
  emojis: string[];
}

/** A shareable "my stats" card PNG. */
export async function buildTrophyCard(d: TrophyCardData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, COLORS.primary);
  g.addColorStop(1, COLORS.secondary);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = '800 40px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText('🀄  MY CLUB MAHJ STATS', 64, 110);

  const cardX = 56;
  const cardY = 160;
  const cardW = W - cardX * 2;
  const cardH = H - cardY - 120;
  roundRect(ctx, cardX, cardY, cardW, cardH, 44);
  ctx.fillStyle = '#fff';
  ctx.fill();

  const pad = 64;
  ctx.fillStyle = COLORS.ink;
  ctx.font = '900 72px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText(d.name, cardX + pad, cardY + 130);

  // 2x2 stat grid
  const stats: [string, string][] = [
    [`${d.cleared}/${d.total}`, 'CLEARED'],
    [`${d.mahjs}`, 'MAHJS'],
    [`${d.points}`, 'POINTS'],
    [`${d.bestStreak}d`, 'BEST STREAK'],
  ];
  const gx = cardX + pad;
  const gy = cardY + 210;
  const gw = (cardW - pad * 2 - 24) / 2;
  const gh = 180;
  stats.forEach(([num, lab], i) => {
    const x = gx + (i % 2) * (gw + 24);
    const y = gy + Math.floor(i / 2) * (gh + 20);
    roundRect(ctx, x, y, gw, gh, 28);
    ctx.fillStyle = '#f4f3ee';
    ctx.fill();
    ctx.fillStyle = COLORS.primary;
    ctx.font = '900 70px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
    ctx.fillText(num, x + 28, y + 96);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '800 26px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
    ctx.fillText(lab, x + 28, y + 140);
  });

  // Trophies row
  const ty = gy + gh * 2 + 60;
  ctx.fillStyle = COLORS.accent;
  ctx.font = '800 34px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText(`🏆 ${d.earned}/${d.totalBadges} TROPHIES`, cardX + pad, ty);
  ctx.font = '60px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText(d.emojis.slice(0, 8).join(' '), cardX + pad, ty + 80);

  ctx.fillStyle = COLORS.muted;
  ctx.font = '700 30px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText('Tracked with Club Mahj · clubmahj.com', cardX + pad, cardY + cardH - 48);

  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? new Blob()), 'image/png'),
  );
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- canvas helpers -------------------------------------------------------

// A cream "paper tile" with a centered suit glyph (or a dot ring when glyph is
// null), optionally rotated about its center. Mirrors the design tile recipe.
function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rotDeg: number,
  glyph: string | null,
  color: string,
  fontPx: number,
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((rotDeg * Math.PI) / 180);
  const r = Math.round(w * 0.14);
  // tile face (subtle top→bottom paper gradient)
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, '#FFFEFB');
  g.addColorStop(1, '#F1EBDD');
  roundRect(ctx, -w / 2, -h / 2, w, h, r);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(20,22,42,0.14)';
  ctx.stroke();
  ctx.fillStyle = color;
  if (glyph) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${fontPx}px ${RND}`;
    ctx.fillText(glyph, 0, fontPx * 0.06);
    ctx.textBaseline = 'alphabetic';
  } else {
    // dot suit: a ring + center pip
    ctx.lineWidth = Math.max(3, fontPx * 0.14);
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, fontPx * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, fontPx * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
): number {
  const words = text.split(/\s+/);
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineH;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cy);
    cy += lineH;
  }
  return cy;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const ar = img.width / img.height;
  const tr = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (ar > tr) {
    sw = img.height * tr;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / tr;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  return img
    .decode
    ? ((img.src = url),
      img.decode().then(
        () => {
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          return img;
        },
        () => img,
      ))
    : new Promise((resolve) => {
        img.onload = () => resolve(img);
        img.src = url;
      });
}
