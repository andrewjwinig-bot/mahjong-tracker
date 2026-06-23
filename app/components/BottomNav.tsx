'use client';

export type Tab = 'card' | 'wins' | 'group' | 'tables' | 'learn';

// Per the design: each tab is a little cream tile holding a multi-color mini
// illustration, over an 8px label + a 3px underline pill. The active tab's tile
// is raised and its label + underline take the theme accent.
const ICONS: Record<Tab, JSX.Element> = {
  card: (
    <svg width="17" height="19" viewBox="0 0 17 19">
      <rect x="2.3" y="1.9" width="12.4" height="15.2" rx="2.4" fill="#fff" stroke="#1A1410" strokeWidth="1.4" />
      <path d="M5 6.2h7" stroke="#C0392B" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 9.5h7" stroke="#10B39A" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 12.8h4.6" stroke="#2E86D4" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  wins: (
    <svg width="19" height="19" viewBox="0 0 20 20">
      <path
        d="M10 2.3 L12.25 7 L17.4 7.6 L13.6 11.2 L14.6 16.3 L10 13.8 L5.4 16.3 L6.4 11.2 L2.6 7.6 L7.75 7 Z"
        fill="#F5A524"
        stroke="#C9871A"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="9.1" r="1.7" fill="#fff" opacity="0.6" />
    </svg>
  ),
  group: (
    <svg width="19" height="19" viewBox="0 0 20 20">
      <ellipse cx="9" cy="11" rx="5" ry="4.3" fill="#10B39A" />
      <circle cx="13" cy="6.9" r="2.7" fill="#10B39A" />
      <path d="M15.1 6.4 L18.6 5.3 L15.5 7.9 Z" fill="#F5A524" />
      <path d="M4.8 10.2 C1.6 8.8 1.2 11.6 4.5 12.9 Z" fill="#E2568F" />
      <path d="M8 15.2 l-0.4 2.8 M11 15 l0.4 2.8" stroke="#C0392B" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="13.5" cy="6.6" r="0.9" fill="#1A1410" />
    </svg>
  ),
  tables: (
    <svg width="19" height="19" viewBox="0 0 20 20">
      <circle cx="10" cy="5.4" r="2.8" fill="#C0392B" />
      <circle cx="14.6" cy="10" r="2.8" fill="#F5A524" />
      <circle cx="10" cy="14.6" r="2.8" fill="#2E86D4" />
      <circle cx="5.4" cy="10" r="2.8" fill="#10B39A" />
      <circle cx="10" cy="10" r="2.5" fill="#F4C84A" stroke="#C9871A" strokeWidth="1" />
    </svg>
  ),
  learn: (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="6.4" fill="#fff" stroke="#2E86D4" strokeWidth="2" />
      <circle cx="9" cy="9" r="2.5" fill="#F5A524" />
    </svg>
  ),
};

// Feed-first (Goodreads model): the social Feed is home, your Card (progress)
// is the immediate second tab.
const TABS: { id: Tab; label: string }[] = [
  { id: 'group', label: 'Feed' },
  { id: 'card', label: 'Card' },
  { id: 'wins', label: 'Mahjs' },
  { id: 'tables', label: 'Tables' },
  { id: 'learn', label: 'Rules' },
];

export default function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="bottom-nav">
      <div className="inner">
        {TABS.map((t) => (
          <button key={t.id} data-active={tab === t.id} onClick={() => onChange(t.id)} aria-label={t.label}>
            <span className="nav-tile">{ICONS[t.id]}</span>
            <span className="nav-label">{t.label}</span>
            <span className="nav-underline" aria-hidden />
          </button>
        ))}
      </div>
    </nav>
  );
}
