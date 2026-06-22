// Practice / study engine: given a rack of tiles, score how close it is to each
// hand on the card and report the missing tiles. Pure + on-device.
//
// This is a best-effort STUDY aid, not a rules-perfect solver. Number groups are
// allowed to flex to whichever suit fits your rack best (real cards add
// cross-group suit constraints we don't fully model), and jokers are applied to
// pungs/kongs (3+) only — never pairs, singles, or flowers, per American rules.

import type { Hand, MahjongCard } from './types';
import type { TileFace } from './tileArt';

export type Suit = 'bam' | 'crak' | 'dot';
export const SUITS: Suit[] = ['bam', 'crak', 'dot'];
export const SUIT_NAME: Record<Suit, string> = { bam: 'Bam', crak: 'Crak', dot: 'Dot' };
// The tile-art face for a suit ("crak" renders as the 'crack' character tile).
export const SUIT_FACE: Record<Suit, TileFace> = { bam: 'bam', crak: 'crack', dot: 'dot' };

export type RackTile =
  | { t: 'num'; suit: Suit; value: number }
  | { t: 'wind'; wind: 'E' | 'S' | 'W' | 'N' }
  | { t: 'dragon'; color: 'R' | 'G' | 'W' } // red / green / white (soap)
  | { t: 'flower' }
  | { t: 'joker' };

const WIND_CHAR: Record<string, string> = { E: '東', S: '南', W: '西', N: '北' };
const WIND_NAME: Record<string, string> = { E: 'East', S: 'South', W: 'West', N: 'North' };
const DRAGON: Record<string, { char: string; color: string; name: string }> = {
  R: { char: '中', color: '#E8455F', name: 'Red' },
  G: { char: '發', color: '#1FA85B', name: 'Green' },
  W: { char: '白', color: '#2F80ED', name: 'Soap (white)' },
};

export interface TileSpec {
  face: TileFace;
  count?: number;
  char?: string;
  color?: string;
}
export interface NeedTile {
  spec: TileSpec;
  label: string;
  count: number;
}
export interface HandMatch {
  hand: Hand;
  matched: number;
  total: number;
  pct: number;
  usedJokers: number;
  need: NeedTile[];
}

// ---- counting helpers -----------------------------------------------------

type Counts = Record<string, number>;
const numKey = (s: Suit, v: number) => `n${s}${v}`;

function rackCounts(rack: RackTile[]): { counts: Counts; jokers: number } {
  const counts: Counts = {};
  let jokers = 0;
  for (const t of rack) {
    if (t.t === 'joker') jokers++;
    else if (t.t === 'num') counts[numKey(t.suit, t.value)] = (counts[numKey(t.suit, t.value)] ?? 0) + 1;
    else if (t.t === 'wind') counts[`w${t.wind}`] = (counts[`w${t.wind}`] ?? 0) + 1;
    else if (t.t === 'dragon') counts[`d${t.color}`] = (counts[`d${t.color}`] ?? 0) + 1;
    else counts.F = (counts.F ?? 0) + 1;
  }
  return { counts, jokers };
}

function take(counts: Counts, key: string, want: number): number {
  const have = counts[key] ?? 0;
  const got = Math.min(have, want);
  counts[key] = have - got;
  return got;
}

// ---- notation parsing -----------------------------------------------------

type Group =
  | { kind: 'flower'; size: number }
  | { kind: 'wind'; wind: 'E' | 'S' | 'W' | 'N'; size: number; jokerOk: boolean }
  | { kind: 'dragon'; size: number; jokerOk: boolean }
  | { kind: 'soap'; size: number; jokerOk: boolean }
  | { kind: 'num'; value: number; size: number; jokerOk: boolean }
  | { kind: 'seq'; slots: Array<{ num?: number; soap?: boolean }> };

const parseCache = new Map<string, Group[]>();

function runs(token: string): string[] {
  const out: string[] = [];
  let cur = '';
  for (const ch of token) {
    if (cur && cur[0] === ch) cur += ch;
    else {
      if (cur) out.push(cur);
      cur = ch;
    }
  }
  if (cur) out.push(cur);
  return out;
}

export function parseHand(notation: string): Group[] {
  const cached = parseCache.get(notation);
  if (cached) return cached;
  const groups: Group[] = [];
  for (const token of notation.trim().split(/\s+/)) {
    if (!token) continue;
    const isDigits = /^[0-9]+$/.test(token);
    const allSame = token.split('').every((c) => c === token[0]);

    if (isDigits && !allSame) {
      // year / mixed sequence, e.g. "2026" — singles, numbers share a suit.
      groups.push({
        kind: 'seq',
        slots: token.split('').map((c) => (c === '0' ? { soap: true } : { num: Number(c) })),
      });
      continue;
    }

    const parts = allSame ? [token] : runs(token);
    for (const part of parts) {
      const c = part[0];
      const size = part.length;
      const jokerOk = size >= 3;
      if (/[0-9]/.test(c)) {
        if (c === '0') groups.push({ kind: 'soap', size, jokerOk });
        else groups.push({ kind: 'num', value: Number(c), size, jokerOk });
      } else if (c === 'F') groups.push({ kind: 'flower', size });
      else if (c === 'D') groups.push({ kind: 'dragon', size, jokerOk });
      else if (c === 'N' || c === 'E' || c === 'W' || c === 'S')
        groups.push({ kind: 'wind', wind: c, size, jokerOk });
      else groups.push({ kind: 'dragon', size, jokerOk }); // unknown honor → treat as dragon
    }
  }
  parseCache.set(notation, groups);
  return groups;
}

export function handTileCount(notation: string): number {
  return parseHand(notation).reduce(
    (n, g) => n + (g.kind === 'seq' ? g.slots.length : g.size),
    0,
  );
}

// ---- matching -------------------------------------------------------------

function bestSuitFor(counts: Counts, value: number, size: number): Suit {
  let best: Suit = 'bam';
  let bestN = -1;
  for (const s of SUITS) {
    const n = Math.min(size, counts[numKey(s, value)] ?? 0);
    if (n > bestN) {
      bestN = n;
      best = s;
    }
  }
  return best;
}

function pushNeed(need: NeedTile[], spec: TileSpec, label: string, n: number) {
  if (n <= 0) return;
  const key = JSON.stringify(spec);
  const existing = need.find((x) => JSON.stringify(x.spec) === key);
  if (existing) existing.count += n;
  else need.push({ spec, label, count: n });
}

export function matchHand(hand: Hand, rack: RackTile[]): HandMatch {
  const groups = parseHand(hand.notation);
  const { counts, jokers: jokerStart } = rackCounts(rack);
  let jokers = jokerStart;
  const need: NeedTile[] = [];
  let matched = 0;
  let usedJokers = 0;
  const total = groups.reduce((n, g) => n + (g.kind === 'seq' ? g.slots.length : g.size), 0) || 14;

  // Order: honors/flowers/soap/seq first (fixed), then number groups largest
  // first (kongs grab their suit), so the flexible suit choice is well-informed.
  const ordered = [...groups].sort((a, b) => {
    const rank = (g: Group) => (g.kind === 'num' ? 1 : 0);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    const sz = (g: Group) => (g.kind === 'seq' ? g.slots.length : g.size);
    return sz(b) - sz(a);
  });

  for (const g of ordered) {
    if (g.kind === 'flower') {
      const got = take(counts, 'F', g.size);
      matched += got;
      pushNeed(need, { face: 'flower' }, 'Flower', g.size - got);
    } else if (g.kind === 'wind') {
      const got = take(counts, `w${g.wind}`, g.size);
      let rem = g.size - got;
      if (g.jokerOk && rem > 0) {
        const j = Math.min(rem, jokers);
        jokers -= j; usedJokers += j; rem -= j;
      }
      matched += g.size - rem;
      pushNeed(need, { face: 'wind', char: WIND_CHAR[g.wind] }, `${WIND_NAME[g.wind]} wind`, rem);
    } else if (g.kind === 'dragon') {
      // pick the color we hold the most of
      let color: 'R' | 'G' | 'W' = 'R';
      let bestN = -1;
      for (const c of ['R', 'G', 'W'] as const) {
        const n = counts[`d${c}`] ?? 0;
        if (n > bestN) { bestN = n; color = c; }
      }
      const got = take(counts, `d${color}`, g.size);
      let rem = g.size - got;
      if (g.jokerOk && rem > 0) { const j = Math.min(rem, jokers); jokers -= j; usedJokers += j; rem -= j; }
      matched += g.size - rem;
      const d = DRAGON[color];
      pushNeed(need, { face: 'dragon', char: d.char, color: d.color }, `${d.name} dragon`, rem);
    } else if (g.kind === 'soap') {
      const got = take(counts, 'dW', g.size);
      let rem = g.size - got;
      if (g.jokerOk && rem > 0) { const j = Math.min(rem, jokers); jokers -= j; usedJokers += j; rem -= j; }
      matched += g.size - rem;
      const d = DRAGON.W;
      pushNeed(need, { face: 'dragon', char: d.char, color: d.color }, 'Soap (white dragon)', rem);
    } else if (g.kind === 'num') {
      const suit = bestSuitFor(counts, g.value, g.size);
      const got = take(counts, numKey(suit, g.value), g.size);
      let rem = g.size - got;
      if (g.jokerOk && rem > 0) { const j = Math.min(rem, jokers); jokers -= j; usedJokers += j; rem -= j; }
      matched += g.size - rem;
      pushNeed(need, { face: SUIT_FACE[suit], count: g.value }, `${g.value} ${SUIT_NAME[suit]}`, rem);
    } else {
      // seq (year) — numbers share one suit, no jokers (singles)
      const numSlots = g.slots.filter((s) => s.num != null) as { num: number }[];
      const wantByVal: Record<number, number> = {};
      for (const s of numSlots) wantByVal[s.num] = (wantByVal[s.num] ?? 0) + 1;
      let suit: Suit = 'bam';
      let bestN = -1;
      for (const s of SUITS) {
        let n = 0;
        for (const v in wantByVal) n += Math.min(wantByVal[v], counts[numKey(s, Number(v))] ?? 0);
        if (n > bestN) { bestN = n; suit = s; }
      }
      for (const v in wantByVal) {
        const got = take(counts, numKey(suit, Number(v)), wantByVal[v]);
        matched += got;
        pushNeed(need, { face: SUIT_FACE[suit], count: Number(v) }, `${v} ${SUIT_NAME[suit]}`, wantByVal[v] - got);
      }
      const soapSlots = g.slots.filter((s) => s.soap).length;
      const gotSoap = take(counts, 'dW', soapSlots);
      matched += gotSoap;
      pushNeed(need, { face: 'dragon', char: DRAGON.W.char, color: DRAGON.W.color }, 'Soap (white dragon)', soapSlots - gotSoap);
    }
  }

  return {
    hand,
    matched,
    total,
    pct: Math.round((matched / total) * 100),
    usedJokers,
    need: need.sort((a, b) => b.count - a.count),
  };
}

/** Rank every hand on the card by how close the rack is. */
export function analyzeRack(card: MahjongCard, rack: RackTile[]): HandMatch[] {
  return card.hands
    .map((h) => matchHand(h, rack))
    .sort((a, b) => b.matched - a.matched || b.pct - a.pct || a.hand.points - b.hand.points);
}
