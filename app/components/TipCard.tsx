'use client';

import { useState } from 'react';
import { TIPS, tipOfTheDayIndex } from '../lib/tips';
import Tile from './Tile';

export default function TipCard() {
  const [i, setI] = useState(() => tipOfTheDayIndex());
  const [shuffled, setShuffled] = useState(false);

  return (
    <div className="tip-card">
      <Tile face="joker" size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="tip-label">{shuffled ? '💡 Pro tip' : '💡 Tip of the day'}</div>
        <div className="tip-text">{TIPS[i]}</div>
      </div>
      <button
        className="icon-btn"
        aria-label="Another tip"
        onClick={() => {
          setI((p) => (p + 1) % TIPS.length);
          setShuffled(true);
        }}
      >
        🔀
      </button>
    </div>
  );
}
