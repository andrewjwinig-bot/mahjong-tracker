'use client';

import { useState } from 'react';
import Tile from './Tile';
import type { TileFace } from '../lib/tileArt';

interface Slide {
  face: TileFace;
  char?: string;
  color?: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    face: 'crack',
    color: '#D23B4E',
    title: 'Call MAHJ',
    body: 'Tap a tile on the Card each time you win that hand. Your card fills in with a confetti storm.',
  },
  {
    face: 'dragon',
    char: '中',
    color: '#D23B4E',
    title: 'Chase the seasons',
    body: 'Every quarter brings a new challenge that pulls hands from across the whole card.',
  },
  {
    face: 'flower',
    color: '#E84C8A',
    title: 'Brag to your table',
    body: 'Share wins to your private tables and the public feed — like, comment, and climb the leaderboard.',
  },
  {
    face: 'joker',
    color: '#7C5CE0',
    title: 'Make it yours',
    body: 'Pick a tile-suit theme, build your tile profile, keep a daily streak, and earn trophies.',
  },
];

export default function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];

  return (
    <div className="tutorial">
      <div className="tutorial-card">
        <button className="tut-skip" onClick={onDone}>
          Skip
        </button>
        <div className="tut-art">
          <Tile face={s.face} char={s.char} color={s.color} size={96} />
        </div>
        <h2>{s.title}</h2>
        <p className="tut-body">{s.body}</p>

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
