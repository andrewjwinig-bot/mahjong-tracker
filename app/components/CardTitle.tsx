import Tile from './Tile';

// "YOUR · {year} · CARD" spelled in mahjong letter-tiles — a custom, hand-set
// wordmark in place of a plain heading. Tiles take theme colors and a gentle
// scatter so it reads playful rather than rigid.
const PALETTE = ['var(--brand)', 'var(--accent)', 'var(--green)', 'var(--n3)'];
const TILT = [-3, 2, -2, 3, -2, 3, -3, 2]; // small per-tile rotation, cycled

export default function CardTitle({ year, size = 42 }: { year: number; size?: number }) {
  const rows = ['YOUR', String(year), 'CARD'];
  let k = 0; // running index for color + tilt variety across all tiles
  return (
    <div className="card-title" role="heading" aria-level={1} aria-label={`Your ${year} Card`}>
      {rows.map((word, r) => (
        <div className="card-title-row" key={r}>
          {word.split('').map((ch, i) => {
            const idx = k++;
            return (
              <span
                key={i}
                className="ct-tile"
                style={{ transform: `rotate(${TILT[idx % TILT.length]}deg)` }}
              >
                <Tile face="letter" char={ch} color={PALETTE[idx % PALETTE.length]} size={size} />
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
