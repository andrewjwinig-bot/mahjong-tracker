// Generates a downloadable "share card" PNG for a win — the artifact whose
// usage is the headline Phase-1 metric. Drawn on a 4:5 canvas (social-friendly).

import { COLORS } from './theme';
import type { Win } from './types';

const W = 1080;
const H = 1350;

export async function buildShareCard(win: Win, handLabel: string | null): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient (blue → green)
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, COLORS.primary);
  g.addColorStop(1, COLORS.secondary);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = '800 40px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText('🀄  2026 MAHJONG TRACKER', 64, 110);

  // White content card
  const cardX = 56;
  const cardY = 160;
  const cardW = W - cardX * 2;
  const cardH = H - cardY - 120;
  roundRect(ctx, cardX, cardY, cardW, cardH, 44);
  ctx.fillStyle = '#fff';
  ctx.fill();

  let cursorY = cardY + 56;
  const pad = 56;

  // Photo (optional)
  if (win.photo) {
    const img = await blobToImage(win.photo);
    const photoH = 560;
    const photoY = cursorY;
    ctx.save();
    roundRect(ctx, cardX + pad, photoY, cardW - pad * 2, photoH, 28);
    ctx.clip();
    drawCover(ctx, img, cardX + pad, photoY, cardW - pad * 2, photoH);
    ctx.restore();
    cursorY = photoY + photoH + 48;
  } else {
    cursorY += 8;
  }

  // "I GOT MAHJ" eyebrow
  ctx.fillStyle = COLORS.accent;
  ctx.font = '800 32px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText('I GOT MAHJ! 🀄', cardX + pad, cursorY);
  cursorY += 70;

  // Hand label (wrapped)
  ctx.fillStyle = COLORS.ink;
  ctx.font = '900 64px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  const label = handLabel ?? 'Mahjong!';
  cursorY = wrapText(ctx, label, cardX + pad, cursorY, cardW - pad * 2, 72) + 24;

  // Note (optional)
  if (win.note) {
    ctx.fillStyle = '#4a4f5e';
    ctx.font = '600 36px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
    cursorY = wrapText(ctx, `“${win.note}”`, cardX + pad, cursorY, cardW - pad * 2, 48) + 16;
  }

  // Date footer
  ctx.fillStyle = COLORS.muted;
  ctx.font = '700 30px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  const date = new Date(win.createdAt).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  ctx.fillText(date, cardX + pad, cardY + cardH - 48);

  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? new Blob()), 'image/png'),
  );
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
  ctx.fillText('🀄  MY MAHJONG STATS', 64, 110);

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
  ctx.fillText('Tracked with Mahjong Tracker', cardX + pad, cardY + cardH - 48);

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
