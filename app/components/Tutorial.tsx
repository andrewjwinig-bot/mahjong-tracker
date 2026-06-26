'use client';

import { useState } from 'react';
import Tile from './Tile';
import type { TileFace } from '../lib/tileArt';
import { useEscape } from '../lib/useEscape';

interface Slide {
  face: TileFace;
  char?: string;
  color: string;
  kicker: string;
  title: string;
  body: string;
}

// Four first-run cards. Each carries its own accent (the tile's suit color) that
// tints the glow pad, kicker, and progress dot so every slide feels distinct.
const SLIDES: Slide[] = [
  {
    face: 'dot',
    color: '#2E86D4',
    kicker: 'At the Table',
    title: 'Score the game',
    body: 'Add your table, set the goal, and tally every hand as you play. Toss the pen and paper.',
  },
  {
    face: 'crack',
    color: '#D23B4E',
    kicker: 'The Card',
    title: 'Call Mahj',
    body: 'Win a hand? Tap it on your Card to clear the whole card!',
  },
  {
    face: 'flower',
    color: '#E84C8A',
    kicker: 'Your Crew',
    title: 'Brag a little',
    body: 'Share wins to your tables and feed — like, comment, and climb the leaderboard. Rack up trophies as you go.',
  },
  {
    face: 'dragon',
    char: '發',
    color: '#15803D',
    kicker: 'Seasons',
    title: 'Chase the seasons',
    body: 'Every quarter brings a fresh challenge that pulls hands from across the whole card.',
  },
];

export default function Tutorial({ onDone }: { onDone: () => void }) {
  useEscape(onDone);
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];

  return (
    <div className="tutorial" style={{ ['--accent' as string]: s.color }}>
      <div className="tutorial-card">
        <button className="tut-skip" onClick={onDone}>
          Skip
        </button>

        {/* key={i} re-mounts the stage each step so the entrance animation replays. */}
        <div className="tut-stage" key={i}>
          <div className="tut-art">
            <span className="tut-pad" aria-hidden />
            <span className="tut-tile">
              <Tile face={s.face} char={s.char} color={s.color} size={96} />
            </span>
          </div>
          <div className="tut-kicker">{s.kicker}</div>
          <h2>{s.title}</h2>
          <p className="tut-body">{s.body}</p>
        </div>

        <div className="tut-dots">
          {SLIDES.map((_, n) => (
            <span key={n} data-on={n === i} />
          ))}
        </div>

        <div className="row">
          {i > 0 && (
            <button className="btn ghost" onClick={() => setI((p) => p - 1)}>
              Back
            </button>
          )}
          <button className="btn" onClick={() => (last ? onDone() : setI((p) => p + 1))}>
            {last ? 'Start Playing' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
