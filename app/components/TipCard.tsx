'use client';

import { useMemo, useState } from 'react';
import { tipsFor, tipOfTheDayIndex } from '../lib/tips';
import { EXPERIENCE_LABEL, type Experience } from '../lib/account';
import Tile from './Tile';

export default function TipCard({ experience }: { experience: Experience }) {
  const tips = useMemo(() => tipsFor(experience), [experience]);
  const [i, setI] = useState(() => tipOfTheDayIndex(tips.length));
  const [shuffled, setShuffled] = useState(false);

  return (
    <div className="tip-card">
      <Tile face="joker" size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="tip-label">
          {shuffled ? '💡 Pro tip' : '💡 Tip of the day'} · {EXPERIENCE_LABEL[experience]}
        </div>
        <div className="tip-text">{tips[i % tips.length]}</div>
      </div>
      <button
        className="icon-btn"
        aria-label="Another tip"
        onClick={() => {
          setI((p) => (p + 1) % tips.length);
          setShuffled(true);
        }}
      >
        🔀
      </button>
    </div>
  );
}
