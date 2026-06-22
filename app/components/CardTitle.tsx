import Tile from './Tile';

// "LETS / MAHJ" spelled in mahjong letter-tiles — a custom, hand-set wordmark
// in place of a plain heading, with colorful accent tiles in two corners.
const PALETTE = ['var(--brand)', 'var(--accent)', 'var(--green)', 'var(--n3)'];
const TILT = [-3, 2, -2, 3, -2, 3, -3, 2]; // small per-tile rotation, cycled

export default function CardTitle({ size = 46 }: { size?: number }) {
  const rows = ['LETS', 'MAHJ'];
  let k = 0;
  return (
    <div className="card-title" role="heading" aria-level={1} aria-label="Let’s Mahj">
      <span className="ct-accent ct-accent-tr" aria-hidden>
        <Tile face="flower" size={size - 2} />
      </span>

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

      <span className="ct-accent ct-accent-bl" aria-hidden>
        <Tile face="bam" size={size - 2} />
      </span>
    </div>
  );
}
