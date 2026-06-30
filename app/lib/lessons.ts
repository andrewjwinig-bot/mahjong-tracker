// Interactive learning curriculum for the Rules tab. Each lesson is a sequence
// of tap-through steps (intro, tile reveals, an animated Charleston, a card
// decoder, melds, quizzes, recap) rendered by LessonModal. Progress is tracked
// on-device; lessons unlock in order so beginners get a guided path.

import type { TileFace } from './tileArt';

export type HeroKind = 'tiles' | 'table' | 'card' | 'win';
export type IconKey = 'card' | 'shuffle' | 'target' | 'meld' | 'compass' | 'shield';
export type DecodeColor = 'red' | 'green' | 'blue' | 'gold' | 'ink';

export interface TileSpec {
  face: TileFace;
  char?: string;
  color?: string;
  name: string;
  desc: string;
}

export interface DecodeGroup {
  text: string;
  color: DecodeColor;
  /** Tiles in this group, for the running 14-tile count. */
  count: number;
  label: string;
  explain: string;
  /** How this group renders as real tiles on the rack visual. */
  tileFace: TileFace;
  tileChar?: string;
  tileColor?: string;
}

export type Step =
  | { k: 'intro'; title: string; body: string; hero: HeroKind }
  | { k: 'tiles'; title: string; body?: string; tiles: TileSpec[] }
  | { k: 'charleston'; title: string; body?: string }
  | { k: 'wind'; title: string; body?: string }
  | { k: 'decode'; title: string; body?: string; groups: DecodeGroup[] }
  | { k: 'meld'; title: string; body?: string }
  | { k: 'targets'; title: string; body?: string }
  | { k: 'safety'; title: string; body?: string }
  | { k: 'note'; title: string; body: string; bullets?: string[]; hero?: HeroKind }
  | { k: 'quiz'; q: string; options: string[]; answer: number; explain: string }
  | { k: 'recap'; title: string; points: string[] };

export interface Lesson {
  id: string;
  title: string;
  blurb: string;
  minutes: number;
  icon: IconKey;
  steps: Step[];
}

export const DECODE_HEX: Record<DecodeColor, string> = {
  red: '#C0392B',
  green: '#2E7D43',
  blue: '#2E86D4',
  gold: '#C9871A',
  ink: '#1A1410',
};

export const LESSONS: Lesson[] = [
  {
    id: 'tiles',
    title: 'Tiles & suits',
    blurb: 'Meet all 152 tiles — suits, winds, dragons, jokers.',
    minutes: 3,
    icon: 'card',
    steps: [
      {
        k: 'intro',
        hero: 'tiles',
        title: 'Meet the tiles',
        body: 'American Mahjong uses 152 tiles. Get to know the cast — once you can name them, the whole card starts to make sense.',
      },
      {
        k: 'tiles',
        title: 'The three suits',
        body: 'Tap each tile. Every numbered tile (1–9) belongs to one of these three suits.',
        tiles: [
          { face: 'bam', name: 'Bams · Bamboo', desc: '1–9. The “1 Bam” is traditionally a little bird. Also called “bamboo.”' },
          { face: 'crack', name: 'Cracks · Characters', desc: '1–9. The 萬 (“wan”) suit — the symbol on top is the number.' },
          { face: 'dot', name: 'Dots · Circles', desc: '1–9. Circles, sometimes called “bings.” That’s all three suits.' },
        ],
      },
      {
        k: 'wind',
        title: 'The four winds',
        body: 'On the card, winds are written as letters: N, E, W, S. Tap each one.',
      },
      {
        k: 'tiles',
        title: 'Dragons, flowers & jokers',
        body: 'Three more tile types round out the set.',
        tiles: [
          { face: 'dragon', char: '中', color: '#E8455F', name: 'Dragons · R G W', desc: 'Red 中, Green 發, White (the “soap”). Each dragon pairs with a suit.' },
          { face: 'flower', name: 'Flowers', desc: 'Eight bonus tiles, written as “F.” Often interchangeable on the card.' },
          { face: 'joker', name: 'Jokers', desc: 'Wild! Stands in for any tile inside a pung, kong, or quint — never a pair or single.' },
        ],
      },
      {
        k: 'quiz',
        q: 'Which tile is wild — it can stand in for others inside a pung or kong?',
        options: ['A Flower', 'A Joker', 'The Red dragon', 'The 1 Bam'],
        answer: 1,
        explain: 'Jokers are wild inside a pung, kong, or quint — but never in a pair or a single.',
      },
      {
        k: 'recap',
        title: 'Nice — you know the tiles',
        points: [
          'Three suits: bams, cracks, dots (each 1–9).',
          'Honors: four winds and three dragons.',
          'Specials: flowers (bonus) and jokers (wild).',
        ],
      },
    ],
  },
  {
    id: 'charleston',
    title: 'The Charleston',
    blurb: 'The opening tile-swap that sets up your hand.',
    minutes: 3,
    icon: 'shuffle',
    steps: [
      {
        k: 'intro',
        hero: 'table',
        title: 'The opening swap',
        body: 'Before anyone draws, players pass tiles around to trade away what they don’t need. This ritual is the Charleston.',
      },
      {
        k: 'charleston',
        title: 'Pass it around',
        body: 'Tap Play to watch each pass. You always move 3 tiles at a time, blind.',
      },
      {
        k: 'note',
        title: 'Second pass & courtesy',
        body: 'After the first Charleston the table may agree to a second one — same three passes, reversed: left, across, right.',
        bullets: [
          'The middle pass of each set may be “blind” — forward tiles you just received.',
          'Finally, players across from each other may swap 0–3 tiles by mutual agreement.',
          'Then play begins with East.',
        ],
      },
      {
        k: 'quiz',
        q: 'In the FIRST Charleston, which way is the very first pass?',
        options: ['Left', 'Right', 'Across', 'Into the wall'],
        answer: 1,
        explain: 'First Charleston goes right → across → left. The optional second one reverses it.',
      },
      {
        k: 'recap',
        title: 'You’ve got the Charleston',
        points: [
          'Pass 3 tiles at a time, blind.',
          'First: right, across, left. Second (optional): left, across, right.',
          'A courtesy pass of 0–3 can follow, then East starts.',
        ],
      },
    ],
  },
  {
    id: 'card',
    title: 'Reading the card',
    blurb: 'Decode a hand’s shorthand — and what the colors mean.',
    minutes: 4,
    icon: 'target',
    steps: [
      {
        k: 'intro',
        hero: 'card',
        title: 'Decode a hand',
        body: 'Each line on the card is one winning 14-tile hand, written in shorthand. Learn to read it and the whole card opens up.',
      },
      {
        k: 'decode',
        title: 'Tap each group',
        body: 'This is one hand. Tap each colored group to see what it means — the count should add up to 14.',
        groups: [
          { text: 'FF', color: 'red', count: 2, label: 'Pair of Flowers', explain: 'Two Flower tiles (shown as “F”). That’s a pair — 2 tiles.', tileFace: 'flower' },
          { text: '2026', color: 'green', count: 4, label: 'The year, one suit', explain: 'The digits 2-0-2-6, all in a single suit. The color tells you which suit.', tileFace: 'bam' },
          { text: '2026', color: 'blue', count: 4, label: 'The year, a 2nd suit', explain: 'The year again — but a different color means a different suit.', tileFace: 'dot' },
          { text: 'DDDD', color: 'ink', count: 4, label: 'Kong of Dragons', explain: 'Four matching Dragons — a “kong.” 2 + 4 + 4 + 4 = 14 tiles. ✓', tileFace: 'dragon', tileChar: '中', tileColor: '#E8455F' },
        ],
      },
      {
        k: 'note',
        title: 'Color = suit',
        hero: 'card',
        body: 'The single most useful trick: a number’s COLOR tells you its suit. The same “3” in red, green, or blue is three different tiles.',
        bullets: [
          'Red, green, blue = the three suits (bam / crack / dot).',
          'A point value sits at the end of each line.',
          'An “X” or “C” marks a hand that must stay concealed.',
        ],
      },
      {
        k: 'quiz',
        q: 'On the card, what does the COLOR of a number tell you?',
        options: ['How many points it’s worth', 'Which suit it is', 'Whether it’s concealed', 'Nothing — it’s decorative'],
        answer: 1,
        explain: 'Color = suit. The same number in a different color is a tile from a different suit.',
      },
      {
        k: 'recap',
        title: 'You can read the card',
        points: [
          'Each line is one 14-tile hand in shorthand.',
          'Color tells you the suit; the number at the end is the points.',
          'Groups add up to exactly 14 tiles.',
        ],
      },
    ],
  },
  {
    id: 'melds',
    title: 'Melds & calling',
    blurb: 'Pairs, pungs, kongs — and grabbing a discard.',
    minutes: 4,
    icon: 'meld',
    steps: [
      {
        k: 'intro',
        hero: 'tiles',
        title: 'Groups of tiles',
        body: 'Every hand is built from groups of matching tiles. Knowing their names lets you read the card and call tiles at the right moment.',
      },
      {
        k: 'meld',
        title: 'The building blocks',
        body: 'Identical tiles, grouped. Tap each one to deal it out — the bigger the group, the more it’s usually worth.',
      },
      {
        k: 'note',
        title: 'Calling a discard',
        body: 'When another player discards a tile you need, you can sometimes “call” it instead of waiting to draw.',
        bullets: [
          'Call a discard to complete a pung, kong, or quint — then expose that group face-up.',
          'You can’t call a discard for a pair or a single — those come from your own tiles.',
          'Calling skips play to you; you then discard and play continues to your right.',
        ],
      },
      {
        k: 'quiz',
        q: 'Can you call a discarded tile to complete a PAIR?',
        options: ['Yes, any time', 'No — pairs come from your own tiles', 'Only with a joker', 'Only if you’re East'],
        answer: 1,
        explain: 'You can call for a pung, kong, or quint — but a pair (or single) must come from tiles you draw or hold.',
      },
      {
        k: 'recap',
        title: 'Melds, locked in',
        points: [
          'Pair = 2, pung = 3, kong = 4, quint = 5 matching tiles.',
          'Call a discard only to make a pung or bigger.',
          'Calling exposes the group and jumps the turn to you.',
        ],
      },
    ],
  },
  {
    id: 'choose',
    title: 'Choosing your hand',
    blurb: 'Commit to the right hand at the right time.',
    minutes: 3,
    icon: 'compass',
    steps: [
      {
        k: 'intro',
        hero: 'win',
        title: 'Pick a target',
        body: 'You can’t chase every hand on the card. The real skill is committing to the right one — and not too early.',
      },
      {
        k: 'targets',
        title: 'Which hand is closer?',
        body: 'Here are your tiles and two hands you could chase. Tap each to see how many tiles away it is — then pick.',
      },
      {
        k: 'note',
        title: 'Stay flexible, then commit',
        body: 'Through the Charleston, keep your options open. Commit only once your tiles clearly point one way.',
        bullets: [
          'Count your “tiles-away” every turn — how many swaps until you win.',
          'Chase the fastest hand, not the prettiest one.',
          'Grab jokers whenever offered; flexibility beats points early.',
          'Only 4 of each tile exist — if 3 are gone, that wait is nearly dead.',
        ],
      },
      {
        k: 'quiz',
        q: 'Mid-game you’re 2 tiles from a 25-point hand and 5 from a flashy 50. Which do you usually chase?',
        options: ['The 50 — more points', 'The 25 — you’re closer', 'Switch every turn', 'Whichever needs jokers'],
        answer: 1,
        explain: 'Speed wins games. A hand you can actually finish beats a prettier one you can’t reach.',
      },
      {
        k: 'recap',
        title: 'Smarter target-picking',
        points: [
          'Stay flexible through the Charleston.',
          'Count tiles-away and chase the fastest hand.',
          'Dead waits (3 of 4 gone) are a trap — pivot.',
        ],
      },
    ],
  },
  {
    id: 'defense',
    title: 'Defensive play',
    blurb: 'When you can’t win, don’t feed the leader.',
    minutes: 3,
    icon: 'shield',
    steps: [
      {
        k: 'intro',
        hero: 'table',
        title: 'When you can’t win',
        body: 'Some hands die. When yours does, switch to defense — your new job is to not hand anyone else the win.',
      },
      {
        k: 'safety',
        title: 'Pick a safe discard',
        body: 'The player across has these tiles exposed. Tap each tile in your hand to see if it’s safe to throw — or a gift.',
      },
      {
        k: 'note',
        title: 'Discard safely',
        body: 'Read the table and starve the player who’s closest. Safe tiles are ones that can’t complete a new group.',
        bullets: [
          'Discard tiles already sitting in someone’s exposure — they’re safest.',
          'Read exposures: what others pung/kong tells you the hand they’re building.',
          'Watch for joker redemption — an exposed group with a joker can be swapped.',
          'Against Singles & Pairs hands (no jokers), single tiles are dangerous late.',
        ],
      },
      {
        k: 'quiz',
        q: 'Your hand is hopeless and an opponent has 3 tiles exposed. Safest discard?',
        options: ['A fresh tile off the wall', 'A tile already in someone’s exposure', 'The tile they just called for', 'A joker'],
        answer: 1,
        explain: 'A tile already exposed on the table can’t start a new group — it’s the safe discard.',
      },
      {
        k: 'recap',
        title: 'You can play defense',
        points: [
          'When your hand is dead, switch to blocking.',
          'Safest discards are tiles already exposed on the table.',
          'Read exposures to know who to starve.',
        ],
      },
    ],
  },
];

// ---- Progress (on-device) -------------------------------------------------

const KEY = 'mahj.learn.done';

export function loadCompleted(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function markCompleted(id: string): string[] {
  const next = Array.from(new Set([...loadCompleted(), id]));
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore — progress is a nicety, not load-bearing */
  }
  return next;
}

/** A lesson is unlocked if it's the first, or the previous one is complete. */
export function isUnlocked(index: number, completed: string[]): boolean {
  if (index <= 0) return true;
  return completed.includes(LESSONS[index - 1].id);
}
