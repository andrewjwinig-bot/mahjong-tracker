'use client';

// Empty state for the Tables screen when you have zero tables: a top-down
// four-seats mahjong table. Your seat is dealt in (three colored-pip tiles);
// the other three seats are dashed slots that pulse with a "+" (invite
// affordance). Tapping the card routes into the create-table flow.
// Ambient motion only — disabled under prefers-reduced-motion (see globals.css).

const SEATS = [
  { cls: 'nt-seat-top', delay: '0s' },
  { cls: 'nt-seat-left', delay: '0.8s' },
  { cls: 'nt-seat-right', delay: '1.6s' },
];
const PIPS = ['#C0392B', '#15803D', '#3B6FE0'];

export default function NoTablesEmpty({ onStart }: { onStart: () => void }) {
  return (
    <button className="nt-card" onClick={onStart} aria-label="No tables yet — start a group">
      <span className="nt-stage" aria-hidden>
        <span className="nt-glow" />

        {/* Center green table with the 中 (red dragon) motif */}
        <span className="nt-table">
          <span className="nt-table-ring" />
          <span className="nt-table-glyph">中</span>
        </span>

        {/* Three empty seats — dashed slots pulsing with a + */}
        {SEATS.map((s) => (
          <span key={s.cls} className={`nt-seat ${s.cls}`} style={{ animationDelay: s.delay }}>
            <span className="nt-seat-plus" style={{ animationDelay: s.delay }}>
              +
            </span>
          </span>
        ))}

        {/* Your seat — three dealt-in tiles with colored pips */}
        {PIPS.map((c, i) => (
          <span
            key={c}
            className="nt-tile"
            style={{ left: 73 + i * 19, animationDelay: `${(0.15 * i).toFixed(2)}s` }}
          >
            <span className="nt-pip" style={{ background: c }} />
          </span>
        ))}
      </span>

      <span className="nt-title">No tables yet</span>
      <span className="nt-body">
        A table seats four. <span className="nt-accent">Start a group</span> and pull your crew up a
        chair.
      </span>
    </button>
  );
}
