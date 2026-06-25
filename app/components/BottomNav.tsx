'use client';

export type Tab = 'card' | 'group' | 'tables' | 'learn';

// Per the design rack: four text labels (FEED · CARD · TABLES · RULES). The
// active tab is a raised cream "paper tile" with a brand-colored label; the
// others are flat ink-grey labels. The rack itself carries the per-theme art.
// Feed-first (Goodreads model): the social Feed is home, the Card is second.
const TABS: { id: Tab; label: string }[] = [
  { id: 'group', label: 'Feed' },
  { id: 'card', label: 'Card' },
  { id: 'tables', label: 'Tables' },
  { id: 'learn', label: 'Rules' },
];

export default function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="bottom-nav">
      <div className="inner">
        {TABS.map((t) => (
          <button
            key={t.id}
            className="nav-tab"
            data-active={tab === t.id}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => onChange(t.id)}
            aria-label={t.label}
          >
            <span className="nav-tab-label">{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
