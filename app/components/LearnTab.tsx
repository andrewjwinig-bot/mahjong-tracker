'use client';

import { useState } from 'react';
import TileStrip from './TileStrip';
import Tile from './Tile';
import type { TileFace } from '../lib/tileArt';

interface Section {
  title: string;
  body: React.ReactNode;
}

/* ---- Visual tile guide ---------------------------------------------------- */

function TileRow({
  tiles,
  name,
  desc,
}: {
  tiles: { face: TileFace; char?: string; color?: string }[];
  name: string;
  desc: string;
}) {
  return (
    <div className="tg-row">
      <div className="tg-tiles">
        {tiles.map((t, i) => (
          <Tile key={i} face={t.face} char={t.char} color={t.color} size={34} />
        ))}
      </div>
      <div className="tg-text">
        <div className="tg-name">{name}</div>
        <div className="tg-desc">{desc}</div>
      </div>
    </div>
  );
}

function TileGuide() {
  return (
    <div className="tile-guide">
      <TileRow
        tiles={[{ face: 'bam' }]}
        name="Bams (Bamboo) · 1–9"
        desc="One of the three suits. The “1 Bam” is traditionally drawn as a little bird."
      />
      <TileRow
        tiles={[{ face: 'crack' }]}
        name="Cracks (Characters) · 1–9"
        desc="The 萬 (“wan”) suit, 1 through 9 — the top symbol is the number."
      />
      <TileRow
        tiles={[{ face: 'dot' }]}
        name="Dots (Circles) · 1–9"
        desc="Circles, 1 through 9. Also called “bings.” Three suits total: bams, cracks, dots."
      />
      <TileRow
        tiles={[
          { face: 'wind', char: '東' },
          { face: 'wind', char: '南' },
          { face: 'wind', char: '西' },
          { face: 'wind', char: '北' },
        ]}
        name="Winds · N E W S"
        desc="Four winds — East 東, South 南, West 西, North 北. Used in NEWS hands."
      />
      <TileRow
        tiles={[
          { face: 'dragon', char: '中', color: '#E8455F' },
          { face: 'dragon', char: '發', color: '#1FA85B' },
          { face: 'dragon', char: '白', color: '#2F80ED' },
        ]}
        name="Dragons · Red · Green · White"
        desc="Three dragons — Red 中, Green 發, and White (the “soap”). Each pairs with a suit."
      />
      <TileRow
        tiles={[{ face: 'flower' }]}
        name="Flowers & Seasons"
        desc="Eight bonus tiles. Often interchangeable on the card and shown as “F.”"
      />
      <TileRow
        tiles={[{ face: 'joker' }]}
        name="Jokers"
        desc="Wild! Jokers stand in for any tile inside a pung, kong, or quint — never in a pair or single."
      />
    </div>
  );
}

/* ---- Charleston ----------------------------------------------------------- */

function Step({ n, dir, children }: { n: number; dir: string; children: React.ReactNode }) {
  return (
    <div className="charleston-step">
      <span className="cs-num">{n}</span>
      <span>
        <span className="cs-dir">{dir} — </span>
        {children}
      </span>
    </div>
  );
}

function Charleston() {
  return (
    <>
      <p>
        The <strong>Charleston</strong> is the opening tile-swap. Everyone passes 3 tiles at a time,
        blind, to trade away what they don’t need and chase a hand on the card.
      </p>
      <p style={{ fontWeight: 800, margin: '12px 0 6px', color: 'var(--brand)' }}>First Charleston (required)</p>
      <Step n={1} dir="Right">
        Pass 3 tiles to the player on your right.
      </Step>
      <Step n={2} dir="Across">
        Pass 3 tiles across the table.
      </Step>
      <Step n={3} dir="Left">
        Pass 3 to your left. This pass may be <em>blind</em> — you can forward tiles you just got.
      </Step>
      <p style={{ fontWeight: 800, margin: '12px 0 6px', color: 'var(--brand)' }}>
        Second Charleston (optional — table agrees)
      </p>
      <Step n={4} dir="Left">
        Pass 3 tiles left.
      </Step>
      <Step n={5} dir="Across">
        Pass 3 tiles across (blind allowed).
      </Step>
      <Step n={6} dir="Right">
        Pass 3 tiles right.
      </Step>
      <p style={{ margin: '12px 0 0' }}>
        <strong>Courtesy pass:</strong> finally, the players across from each other may swap{' '}
        <strong>0–3</strong> tiles by mutual agreement. Then play begins with East.
      </p>
    </>
  );
}

/* ---- Sections ------------------------------------------------------------- */

const SECTIONS: Section[] = [
  {
    title: '🀄 Understanding the tiles',
    body: <TileGuide />,
  },
  {
    title: '🎯 How to play (the 60-second version)',
    body: (
      <>
        <p>
          American Mahjong is played by four people with 152 tiles. Each year the National Mah Jongg
          League publishes a <strong>card</strong> of ~70 winning hands grouped into categories.
        </p>
        <p>
          You start with 13 tiles and take turns drawing and discarding, racing to build one of the
          hands on the card. Call <em>“Mahjong!”</em> when your 14 tiles match a hand exactly — that
          hand’s point value is yours.
        </p>
        <p>This app is your scorecard: tap a hand each time you win it and watch your card fill in.</p>
      </>
    ),
  },
  {
    title: '🔄 The Charleston (step-by-step)',
    body: <Charleston />,
  },
  {
    title: '👥 Playing with 3 players',
    body: (
      <>
        <p>
          The card is built for four, but three works great with a couple of house tweaks (most
          casual tables play it this way):
        </p>
        <ul>
          <li>Deal as normal — each player still gets 13 tiles.</li>
          <li>
            In the Charleston, <strong>skip the “across” passes</strong> (there’s no one across) —
            just do the right and left passes.
          </li>
          <li>Everything else is identical: draw, discard, call, and aim for a hand on the card.</li>
          <li>Hands tend to go faster and the wall lasts longer, so you’ll see more tiles.</li>
        </ul>
      </>
    ),
  },
  {
    title: '👤 Playing with 2 players',
    body: (
      <>
        <p>Two-player mahjong is a quick, punchy version — perfect for practice:</p>
        <ul>
          <li>Each player draws 13 tiles.</li>
          <li>
            Charleston is reduced to a single <strong>pass right, then pass left</strong> (or skip it
            entirely).
          </li>
          <li>Take turns drawing and discarding; you can call the other player’s discards as usual.</li>
          <li>Same card, same jokers, same goal — just faster and more tactical.</li>
        </ul>
        <p style={{ color: 'var(--muted)', fontWeight: 700 }}>
          (2- and 3-player rules are common house variations, not official NMJL tournament rules.)
        </p>
      </>
    ),
  },
  {
    title: '🎴 What does “clearing the card” mean?',
    body: (
      <>
        <p>
          The yearlong challenge: win <strong>every hand on the card at least once</strong> before
          next April’s new card drops. It’s the “collect them all” of mahjong.
        </p>
        <p>
          The <strong>Card</strong> tab shows how many of the ~70 you’ve cleared, your total wins,
          and your points. Use the <strong>To Go</strong> filter to see what’s left to hunt.
        </p>
      </>
    ),
  },
  {
    title: '📖 Reading the notation',
    body: (
      <>
        <p>Hands are written in shorthand. A few common symbols:</p>
        <ul>
          <li><strong>F</strong> — Flower tile</li>
          <li><strong>D</strong> — Dragon (color matches the suit)</li>
          <li><strong>N E W S</strong> — the wind tiles (North, East, West, South)</li>
          <li><strong>Numbers</strong> — actual number tiles in a suit</li>
          <li><strong>C</strong> badge — the hand must be played <em>concealed</em></li>
        </ul>
        <p>
          The colors here are decorative — they just help your eye group the tiles. The official card
          uses color to show which <em>suit</em> each group must be.
        </p>
      </>
    ),
  },
  {
    title: '💡 Tips',
    body: (
      <ul>
        <li>Log the win the moment it happens — before the tiles get scooped up for the next hand.</li>
        <li>Snap a quick photo of a pretty hand; it makes a great share card.</li>
        <li>Chase the <strong>Singles &amp; Pairs</strong> hands when you’re feeling brave — they’re worth the most.</li>
        <li>Use the <strong>To Go</strong> filter at the start of a session to pick a target.</li>
        <li>Keep jokers for pungs/kongs — they can’t be used in a pair or a single.</li>
      </ul>
    ),
  },
  {
    title: '❓ FAQ',
    body: (
      <>
        <p>
          <strong>Is my data private?</strong> Yes — everything lives only on this device. No account,
          no cloud, nothing leaves your phone.
        </p>
        <p>
          <strong>Is this the official NMJL card?</strong> No. This is a sample card so you can try the
          app. Licensed/official cards are planned.
        </p>
        <p>
          <strong>What happens in April?</strong> A new card comes out each spring. Future versions
          will let you load the new year without losing your history.
        </p>
      </>
    ),
  },
  {
    title: '🎉 Fun facts',
    body: (
      <ul>
        <li>The National Mah Jongg League was founded in 1937 and still issues a new card every year.</li>
        <li>Those little “bams,” “cracks,” and “dots” are the three suits — Bamboo, Characters, and Circles.</li>
        <li>The flowers and jokers are the wild cards that make the wild hands possible.</li>
        <li>“Mah Jongg” roughly translates to “sparrow” — listen for the clatter of tiles, the “twittering of the sparrows.”</li>
      </ul>
    ),
  },
];

export default function LearnTab() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="screen">
      <header className="app-header">
        <h1>The Rules</h1>
        <p className="sub">New to the tiles? Start here, bam-beginner. 🀐</p>
        <TileStrip count={7} />
      </header>

      <div style={{ marginTop: 18 }}>
        {SECTIONS.map((s, i) => (
          <div className="acc" key={i} data-open={open === i}>
            <button onClick={() => setOpen(open === i ? null : i)}>
              <span>{s.title}</span>
              <span className="chev">▶</span>
            </button>
            {open === i && <div className="acc-body">{s.body}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
