// The themed loading state: two rows of cream tiles that ripple left-to-right
// like a wall being stacked. Shown while the app loads its on-device data.
export default function LoadingWall() {
  const tiles = Array.from({ length: 14 }); // 2 rows × 7
  return (
    <div className="loading-wall-wrap">
      <div className="loading-wall" aria-hidden>
        {tiles.map((_, i) => (
          <span
            key={i}
            className="lw-tile"
            // Ripple by column so it reads as left-to-right stacking.
            style={{ animationDelay: `${(i % 7) * 0.1}s` }}
          />
        ))}
      </div>
      <div className="loading-text">Stacking the wall…</div>
    </div>
  );
}
