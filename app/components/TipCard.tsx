'use client';

import { useMemo, useState } from 'react';
import { tipsFor, tipOfTheDayIndex } from '../lib/tips';
import type { Experience } from '../lib/account';
import { IconShuffle } from './uiIcons';

export default function TipCard({ experience }: { experience: Experience }) {
  const tips = useMemo(() => tipsFor(experience), [experience]);
  const [i, setI] = useState(() => tipOfTheDayIndex(tips.length));
  const [shuffled, setShuffled] = useState(false);

  return (
    <div className="tip-card">
      <span className="tip-tile" aria-hidden>
        ★
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="tip-label">{shuffled ? 'PRO TIP' : 'TIP OF THE DAY'}</div>
        <div className="tip-text">{tips[i % tips.length]}</div>
      </div>
      <button
        className="tip-shuffle"
        aria-label="Another tip"
        onClick={() => {
          setI((p) => (p + 1) % tips.length);
          setShuffled(true);
        }}
      >
        <IconShuffle size={16} />
      </button>
    </div>
  );
}
