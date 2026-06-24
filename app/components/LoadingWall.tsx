// The themed loading state: two rows of cream tiles that ripple left-to-right
// like a wall being stacked. Shown once per app-open while on-device data loads.
// Greets the player by name when we know it.
export default function LoadingWall({ name }: { name?: string }) {
  const tiles = Array.from({ length: 14 }); // 2 rows × 7
  const first = name?.trim().split(/\s+/)[0];
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
      <div className="loading-text">{first ? `Welcome back, ${first}` : 'Stacking the wall…'}</div>
    </div>
  );
}
