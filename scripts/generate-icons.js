// Dependency-free PNG icon generator for Club Mahj. Renders the brand mark — two
// fanned mahjong tiles (a "bam-M" + a flower) on the felt-green radial — as the
// flattened rasters a PWA / app store needs, plus a monochrome bam-M silhouette
// for notification / template icons. Run: `npm run icons`.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'icons');

// ---- tiny RGBA canvas -----------------------------------------------------
function canvas(size) {
  return { size, data: new Uint8Array(size * size * 4) };
}
function px(c, x, y, [r, g, b, a]) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= c.size || y >= c.size) return;
  const i = (y * c.size + x) * 4;
  const ia = a / 255;
  c.data[i] = c.data[i] * (1 - ia) + r * ia;
  c.data[i + 1] = c.data[i + 1] * (1 - ia) + g * ia;
  c.data[i + 2] = c.data[i + 2] * (1 - ia) + b * ia;
  c.data[i + 3] = Math.max(c.data[i + 3], a);
}
function circle(c, cx, cy, r, col) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > r) continue;
      const a = d > r - 1 ? (r - d) * col[3] : col[3];
      px(c, x, y, [col[0], col[1], col[2], Math.max(0, Math.min(255, a))]);
    }
  }
}

// Anti-aliased polygon fill (3×3 supersample). colFn(x, y) -> [r, g, b, a?].
function inPoly(qx, qy, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0];
    const yi = pts[i][1];
    const xj = pts[j][0];
    const yj = pts[j][1];
    if (yi > qy !== yj > qy && qx < ((xj - xi) * (qy - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
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
      const a = (col[3] == null ? 255 : col[3]) * (cov / 9);
      px(c, x, y, [col[0], col[1], col[2], a]);
    }
  }
}

// ---- color helpers --------------------------------------------------------
const FELT_R0 = [36, 107, 74]; // #246B4A
const FELT_R1 = [26, 84, 57]; // #1A5439
const FELT_R2 = [18, 63, 45]; // #123F2D
const FACE0 = [255, 255, 255]; // paper face highlight
const FACE1 = [251, 247, 236]; // #FBF7EC
const FACE2 = [235, 226, 206]; // #EBE2CE
const BAM_EDGE = [12, 80, 38]; // #0C5026
const BAM_MID = [43, 164, 92]; // #2BA45C
const BAM_NODE = [9, 44, 23]; // node banding
const PETAL = [224, 78, 152]; // ~#DB2777 mid
const PETAL_HI = [249, 168, 212]; // #F9A8D4
const CORE = [245, 205, 120]; // #FBD37A
const CORE_DEEP = [224, 148, 28]; // #E0941C
const BORDER = [44, 58, 48];

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function stops3(t, c0, c1, c2) {
  return t < 0.5 ? mix(c0, c1, t / 0.5) : mix(c1, c2, (t - 0.5) / 0.5);
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ---- 2D transform (rotate about a center, then translate) -----------------
function tile2device(cx, cy, deg) {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return (lx, ly) => [cx + lx * cos - ly * sin, cy + lx * sin + ly * cos];
}
function device2tile(cx, cy, deg) {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return (dx, dy) => {
    const x = dx - cx;
    const y = dy - cy;
    return [x * cos + y * sin, -x * sin + y * cos];
  };
}
const mapPts = (T, pts) => pts.map(([x, y]) => T(x, y));
const offset = (pts, ox, oy) => pts.map(([x, y]) => [x + ox, y + oy]);

// Rotated ellipse as a polygon (local space).
function ellipsePoly(cx, cy, rx, ry, deg, seg = 30) {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const pts = [];
  for (let i = 0; i < seg; i++) {
    const t = (i / seg) * 2 * Math.PI;
    const ex = Math.cos(t) * rx;
    const ey = Math.sin(t) * ry;
    pts.push([cx + ex * cos - ey * sin, cy + ex * sin + ey * cos]);
  }
  return pts;
}
const rotPts = (pts, deg) => {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return pts.map(([x, y]) => [x * cos - y * sin, x * sin + y * cos]);
};

// Rounded-rect perimeter polygon, centered on the origin (local tile space).
function rrPoly(hw, hh, r, seg = 6) {
  r = Math.min(r, hw, hh);
  const pts = [];
  const corners = [
    [hw - r, -(hh - r), -90, 0],
    [hw - r, hh - r, 0, 90],
    [-(hw - r), hh - r, 90, 180],
    [-(hw - r), -(hh - r), 180, 270],
  ];
  for (const [ccx, ccy, a0, a1] of corners) {
    for (let s = 0; s <= seg; s++) {
      const th = ((a0 + ((a1 - a0) * s) / seg) * Math.PI) / 180;
      pts.push([ccx + r * Math.cos(th), ccy + r * Math.sin(th)]);
    }
  }
  return pts;
}

// ---- the brand mark -------------------------------------------------------
// Draw one paper tile (border + gradient face) at center (cx,cy), rotated `deg`.
function drawTileFace(c, cx, cy, hw, hh, deg) {
  const T = tile2device(cx, cy, deg);
  const inv = device2tile(cx, cy, deg);
  const r = hw * 0.26;
  const bw = hw * 0.05;
  fillPoly(c, mapPts(T, rrPoly(hw + bw, hh + bw, r + bw)), () => [...BORDER, 255]);
  fillPoly(c, mapPts(T, rrPoly(hw, hh, r)), (x, y) => {
    const [lx, ly] = inv(x, y);
    const t = clamp01(((lx + hw) / (2 * hw)) * 0.42 + ((ly + hh) / (2 * hh)) * 0.58);
    return [...stops3(t, FACE0, FACE1, FACE2), 255];
  });
}

// Three vertical bamboo sticks (outer tall, middle short → "M") in tile space.
function drawBam(c, cx, cy, hw, hh, deg) {
  const T = tile2device(cx, cy, deg);
  const sw = hw * 0.133; // stick half-width
  const xs = [-0.433 * hw, 0, 0.433 * hw];
  const yBottom = hh * 0.63;
  const tops = [-hh * 0.395, -hh * 0.026, -hh * 0.395];
  xs.forEach((xc, i) => {
    const yTop = tops[i];
    const barHH = (yBottom - yTop) / 2;
    const barCY = (yBottom + yTop) / 2;
    // edge-dark bar, then a lighter core down the middle (90° node gradient look)
    fillPoly(c, mapPts(T, offset(rrPoly(sw, barHH, sw), xc, barCY)), () => [...BAM_EDGE, 255]);
    fillPoly(c, mapPts(T, offset(rrPoly(sw * 0.52, barHH - sw * 0.4, sw * 0.52), xc, barCY)), () => [...BAM_MID, 255]);
    // node banding: tall sticks at 31% & 64%, short stick at 47% of bar height
    const fr = i === 1 ? [0.47] : [0.31, 0.64];
    fr.forEach((f) => {
      const yb = yTop + (yBottom - yTop) * f;
      fillPoly(c, mapPts(T, offset(rrPoly(sw, sw * 0.34, sw * 0.2), xc, yb)), () => [...BAM_NODE, 255]);
    });
  });
}

// Six soft rounded petals around a gold core, centered in the tile.
function drawFlower(c, cx, cy, hw, hh, deg) {
  const T = tile2device(cx, cy, deg);
  const fR = hh * 0.46; // flower radius
  const dist = fR * 0.52; // petal center distance from flower center
  const rx = fR * 0.27;
  const ry = fR * 0.44;
  for (let k = 0; k < 6; k++) {
    const ang = k * 60;
    const petal = rotPts(ellipsePoly(0, -dist, rx, ry, 0), ang);
    fillPoly(c, mapPts(T, petal), () => [...PETAL, 255]);
    // soft lighter sheen toward the outer half of the petal (180° gradient look)
    const sheen = rotPts(ellipsePoly(0, -dist - ry * 0.28, rx * 0.62, ry * 0.5, 0), ang);
    fillPoly(c, mapPts(T, sheen), () => [...PETAL_HI, 120]);
  }
  const [dcx, dcy] = T(0, 0);
  circle(c, dcx, dcy, fR * 0.34, [...CORE, 255]);
  circle(c, dcx, dcy, fR * 0.2, [...CORE_DEEP, 255]);
}

// ---- backgrounds ----------------------------------------------------------
function feltBackground(c) {
  const S = c.size;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const d = clamp01(Math.hypot(x - S / 2, y) / (S * 1.05));
      const col = d < 0.7 ? mix(FELT_R0, FELT_R1, d / 0.7) : mix(FELT_R1, FELT_R2, (d - 0.7) / 0.3);
      px(c, x, y, [col[0], col[1], col[2], 255]);
    }
  }
  // 45° white pinstripe at ~4.5% + a soft inner-shadow vignette at the edges
  const period = Math.max(8, Math.round(S / 13));
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if ((x + y) % period < 1.5) px(c, x, y, [255, 255, 255, 12]);
      const d = Math.hypot(x - S / 2, y - S / 2) / (S * 0.5 * Math.SQRT2);
      const v = clamp01((d - 0.72) / 0.28);
      if (v > 0) px(c, x, y, [0, 0, 0, v * 30]);
    }
  }
}

// Clip everything outside an iOS-style rounded square (transparent corners).
function roundCorners(c, r) {
  const S = c.size;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = Math.max(r - (x + 0.5), x + 0.5 - (S - r), 0);
      const dy = Math.max(r - (y + 0.5), y + 0.5 - (S - r), 0);
      const cover = Math.max(0, Math.min(1, r - Math.hypot(dx, dy) + 0.5));
      if (cover < 1) {
        const i = (y * S + x) * 4;
        c.data[i + 3] = Math.round(c.data[i + 3] * cover);
      }
    }
  }
}

// ---- compose --------------------------------------------------------------
function draw(size, { maskable, rounded }) {
  const c = canvas(size);
  feltBackground(c);
  // More padding for maskable (safe zone) so tiles never clip the mask. The fan
  // is spread enough that all three bam sticks clear the flower tile (reads "M").
  const hw = size * (maskable ? 0.165 : 0.19);
  const hh = hw * 1.27;
  const bamC = [size * 0.38, size * 0.485];
  const flowerC = [size * 0.62, size * 0.525];
  drawTileFace(c, bamC[0], bamC[1], hw, hh, -11);
  drawBam(c, bamC[0], bamC[1], hw, hh, -11);
  drawTileFace(c, flowerC[0], flowerC[1], hw, hh, 9);
  drawFlower(c, flowerC[0], flowerC[1], hw, hh, 9);
  if (rounded) roundCorners(c, size * 0.225); // iOS-style squircle corners
  return c;
}

// Monochrome bam-M silhouette on transparent — notification / template icon.
function drawMono(size, col = [255, 255, 255, 255]) {
  const c = canvas(size);
  const sw = size * 0.085; // stick half-width
  const xs = [-0.3 * size, 0, 0.3 * size].map((v) => v + size / 2);
  const yBottom = size * 0.76;
  const tops = [size * 0.24, size * 0.46, size * 0.24];
  xs.forEach((xc, i) => {
    const yTop = tops[i];
    const barHH = (yBottom - yTop) / 2;
    const barCY = (yBottom + yTop) / 2;
    fillPoly(c, offset(rrPoly(sw, barHH, sw), xc, barCY), () => col);
  });
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
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
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
  // 192/512 get pre-rounded squircle corners (PWA / store display).
  ['icon-192.png', () => draw(192, { rounded: true })],
  ['icon-512.png', () => draw(512, { rounded: true })],
  // Maskable + apple-touch stay full-bleed squares — the OS applies its own mask.
  ['icon-512-maskable.png', () => draw(512, { maskable: true })],
  ['apple-touch-icon.png', () => draw(180, {})],
  ['icon-mono.png', () => drawMono(96)],
];
for (const [name, make] of targets) {
  fs.writeFileSync(path.join(OUT, name), encodePNG(make()));
  console.log('wrote', name);
}
