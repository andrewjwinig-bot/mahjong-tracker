'use client';

export type Tab = 'card' | 'group' | 'tables' | 'learn' | 'you';

// Per the design rack: text labels (FEED · CARD · TABLES · RULES · YOU). The
// active tab is a raised cream "paper tile" with a brand-colored label; the
// others are flat ink-grey labels. The rack itself carries the per-theme art.
// Feed-first (Goodreads model): the social Feed is home, the Card is second;
// "You" (profile, level, trophies, stats) anchors the far end.
const TABS: { id: Tab; label: string }[] = [
  { id: 'group', label: 'Feed' },
  { id: 'card', label: 'Card' },
  { id: 'tables', label: 'Tables' },
  { id: 'learn', label: 'Rules' },
  { id: 'you', label: 'You' },
];

export default function BottomNav({
  tab,
  onChange,
  badges,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  badges?: Partial<Record<Tab, number>>;
}) {
  return (
    <nav className="bottom-nav">
      <div className="inner">
        {TABS.map((t) => {
          const count = badges?.[t.id] ?? 0;
          return (
            <button
              key={t.id}
              className="nav-tab"
              data-active={tab === t.id}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => onChange(t.id)}
              aria-label={count > 0 ? `${t.label}, ${count} unread` : t.label}
            >
              <span className="nav-tab-label">{t.label}</span>
              {count > 0 && <span className="nav-badge">{count > 9 ? '9+' : count}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
