'use client';

import Tile from './Tile';
import type { TileFace } from '../lib/tileArt';

export type Tab = 'card' | 'wins' | 'group' | 'learn';

// Tile-icon nav + mahjong lingo. A mahjong group is a "table"; the learn tab
// is the "rules"; wins are "mahjs".
const TABS: { id: Tab; label: string; face: TileFace; char?: string; color?: string }[] = [
  { id: 'card', label: 'Card', face: 'crack' },
  { id: 'wins', label: 'Mahjs', face: 'dragon', char: '中', color: '#E8455F' },
  { id: 'group', label: 'Feed', face: 'flower' },
  { id: 'learn', label: 'Rules', face: 'dot' },
];

export default function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="bottom-nav">
      <div className="inner">
        {TABS.map((t) => (
          <button
            key={t.id}
            data-active={tab === t.id}
            onClick={() => onChange(t.id)}
            aria-label={t.label}
          >
            <Tile face={t.face} char={t.char} color={t.color} size={26} className="nav-tile" />
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
