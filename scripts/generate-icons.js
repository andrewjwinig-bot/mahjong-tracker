// Dependency-free PNG icon generator. Draws the app icon (blue tile w/ a coral
// dot + green bar) at the sizes a PWA needs. Run: `npm run icons`.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'icons');

// ---- tiny RGBA canvas -----------------------------------------------------
function canvas(size) {
  return { size, data: new Uint8Array(size * size * 4) };
}
function px(c, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= c.size || y >= c.size) return;
  const i = (y * c.size + x) * 4;
  const ia = a / 255;
  c.data[i] = c.data[i] * (1 - ia) + r * ia;
  c.data[i + 1] = c.data[i + 1] * (1 - ia) + g * ia;
  c.data[i + 2] = c.data[i + 2] * (1 - ia) + b * ia;
  c.data[i + 3] = Math.max(c.data[i + 3], a);
}
function fillRect(c, x0, y0, w, h, col) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) px(c, x, y, col);
}
function roundRect(c, x0, y0, w, h, r, col) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const dx = Math.min(x - x0, x0 + w - 1 - x);
      const dy = Math.min(y - y0, y0 + h - 1 - y);
      if (dx < r && dy < r) {
        const d = Math.hypot(r - dx, r - dy);
        if (d > r) continue;
        const a = d > r - 1 ? (r - d) * col[3] : col[3]; // AA edge
        px(c, x, y, [col[0], col[1], col[2], Math.max(0, Math.min(255, a))]);
      } else px(c, x, y, col);
    }
  }
}
function circle(c, cx, cy, r, col) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > r) continue;
      const a = d > r - 1 ? (r - d) * col[3] : col[3];
      px(c, x, y, [col[0], col[1], col[2], Math.max(0, Math.min(255, a))]);
    }
  }
}

const JADE_TOP = [18, 184, 158]; // brand jade, lighter
const JADE_BOT = [11, 124, 107]; // deeper jade
const IVORY = [253, 251, 245, 255]; // bone tile
const SHEEN = [255, 255, 255, 46]; // soft top highlight
// Joker star gradient stops + outline.
const CORAL = [232, 69, 95];
const GOLD = [229, 154, 43];
const VIOLET = [124, 92, 224];
const NAVY = [44, 58, 87];

function inPoly(px_, py_, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0];
    const yi = pts[i][1];
    const xj = pts[j][0];
    const yj = pts[j][1];
    if (yi > py_ !== yj > py_ && px_ < ((xj - xi) * (py_ - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Anti-aliased polygon fill; colFn(x, y) -> [r, g, b].
function fillPoly(c, pts, colFn) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
      let cov = 0;
      for (let sy = 0; sy < 3; sy++) {
        for (let sx = 0; sx < 3; sx++) {
          if (inPoly(x + (sx + 0.5) / 3, y + (sy + 0.5) / 3, pts)) cov++;
        }
      }
      if (cov === 0) continue;
      const col = colFn(x, y);
      px(c, x, y, [col[0], col[1], col[2], Math.round((cov / 9) * 255)]);
    }
  }
}

// Scale a polygon about a center point (used for outlines).
function scalePoly(pts, f, cx, cy) {
  return pts.map((p) => [cx + (p[0] - cx) * f, cy + (p[1] - cy) * f]);
}

// A jester-hat lobe (the joker emblem): an outlined point with a bell.
function lobe(c, baseX, baseY, tipX, tipY, halfBase, col) {
  const pts = [
    [baseX - halfBase, baseY],
    [tipX, tipY],
    [baseX + halfBase, baseY],
  ];
  const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3;
  const cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
  fillPoly(c, pts, () => NAVY); // outline base
  fillPoly(c, scalePoly(pts, 0.84, cx, cy), () => col); // colored fill
  // bell at the tip
  circle(c, Math.round(tipX), Math.round(tipY), Math.round(halfBase * 0.62), [...NAVY, 255]);
  circle(c, Math.round(tipX), Math.round(tipY), Math.round(halfBase * 0.42), [...GOLD, 255]);
}

// Vertical gradient background fill.
function gradientV(c, top, bot) {
  for (let y = 0; y < c.size; y++) {
    const t = y / (c.size - 1);
    const col = [
      Math.round(top[0] + (bot[0] - top[0]) * t),
      Math.round(top[1] + (bot[1] - top[1]) * t),
      Math.round(top[2] + (bot[2] - top[2]) * t),
      255,
    ];
    for (let x = 0; x < c.size; x++) px(c, x, y, col);
  }
}

const GREEN = [31, 168, 91];

// 5x7 block glyphs (each row is 5 bits, MSB = leftmost column).
const FONT = {
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b10010, 0b10010, 0b01100],
};

function drawGlyph(c, rows, x0, y0, cell, col) {
  for (let r = 0; r < 7; r++) {
    for (let k = 0; k < 5; k++) {
      if (rows[r] & (1 << (4 - k))) {
        fillRect(c, Math.round(x0 + k * cell), Math.round(y0 + r * cell),
          Math.ceil(cell), Math.ceil(cell), [...col, 255]);
      }
    }
  }
}

// Centered word; each letter takes its own color from `cols`.
function drawWord(c, word, cx, yTop, cell, cols) {
  const lw = 5 * cell;
  const gap = cell;
  const total = word.length * lw + (word.length - 1) * gap;
  let x = cx - total / 2;
  for (let i = 0; i < word.length; i++) {
    drawGlyph(c, FONT[word[i]], x, yTop, cell, cols[i % cols.length]);
    x += lw + gap;
  }
}

function draw(size, { maskable }) {
  const c = canvas(size);
  gradientV(c, JADE_TOP, JADE_BOT); // full-bleed jade gradient

  const inset = maskable ? size * 0.22 : size * 0.18; // tile padding
  const tx = Math.round(inset);
  const ty = Math.round(inset);
  const tw = Math.round(size - inset * 2);
  const r = tw * 0.24;

  roundRect(c, tx, ty, tw, tw, r, IVORY); // ivory mahjong tile
  // soft top sheen on the tile
  roundRect(c, tx, ty, tw, Math.round(tw * 0.42), r, SHEEN);

  // joker-tile style: three jester bells over the "MAHJ" wordmark
  const mx = size / 2;
  const bellY = Math.round(ty + tw * 0.26);
  const bellR = Math.round(tw * 0.07);
  const bellCols = [CORAL, GOLD, VIOLET];
  [-1, 0, 1].forEach((d, i) => {
    const bx = Math.round(mx + d * tw * 0.26);
    circle(c, bx, bellY, bellR + 2, [...NAVY, 255]);
    circle(c, bx, bellY, bellR, [...bellCols[i], 255]);
  });

  // wordmark
  const cell = tw / 26;
  drawWord(c, 'MAHJ', mx, ty + tw * 0.46, cell, [CORAL, GOLD, VIOLET, GREEN]);

  return c;
}

// ---- PNG encoding ---------------------------------------------------------
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(c) {
  const { size, data } = c;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // raw scanlines with filter byte 0
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    data.subarray(y * size * 4, (y + 1) * size * 4).forEach((v, i) => {
      raw[y * (size * 4 + 1) + 1 + i] = v;
    });
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- emit -----------------------------------------------------------------
fs.mkdirSync(OUT, { recursive: true });
const targets = [
  ['icon-192.png', 192, { maskable: false }],
  ['icon-512.png', 512, { maskable: false }],
  ['icon-512-maskable.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, { maskable: false }],
];
for (const [name, size, opts] of targets) {
  fs.writeFileSync(path.join(OUT, name), encodePNG(draw(size, opts)));
  console.log('wrote', name);
}
