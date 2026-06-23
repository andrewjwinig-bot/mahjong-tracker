import type { MahjongCard } from '../lib/types';

// "The 70 Hands — your collection": a grid of tile cells, one per hand on the
// card. Cleared hands flip face-up (cream→white, points + check); the rest sit
// face-down with a faint ring motif. A signature, motivational overview.
export default function CollectionBoard({
  card,
  handCounts,
}: {
  card: MahjongCard;
  handCounts: Record<string, number>;
}) {
  const cleared = card.hands.filter((h) => (handCounts[h.id] ?? 0) > 0).length;
  return (
    <section className="collection">
      <div className="cat-head" style={{ marginTop: 18 }}>
        <span
          className="pill"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          ★ The 70 Hands — Your Collection
        </span>
        <span className="count">
          {cleared} / {card.hands.length}
        </span>
      </div>

      <div className="hand-grid" role="list" aria-label="Your 70-hand collection">
        {card.hands.map((h) => {
          const got = (handCounts[h.id] ?? 0) > 0;
          return (
            <div
              className="hand-cell"
              data-got={got}
              key={h.id}
              role="listitem"
              title={got ? `${h.notation} · ${h.points} pts` : 'Not yet cleared'}
            >
              {got ? (
                <>
                  <span className="hc-pts">{h.points}</span>
                  <span className="hc-check" aria-hidden>
                    ✓
                  </span>
                </>
              ) : (
                <span className="hc-ring" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
