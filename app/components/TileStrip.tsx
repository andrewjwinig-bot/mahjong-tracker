// Decorative little row of mahjong tiles — framed as chips so they read as
// tiles on every platform regardless of how the glyph renders.
const TILES = ['🀇', '🀐', '🀙', '🀄', '🀅', '🀀', '🀛', '🀒', '🀜', '🀗'];

export default function TileStrip({ count = 7 }: { count?: number }) {
  const tiles = Array.from({ length: count }, (_, i) => TILES[i % TILES.length]);
  return (
    <div className="tile-strip" aria-hidden>
      {tiles.map((t, i) => (
        <span key={i}>{t}</span>
      ))}
    </div>
  );
}
