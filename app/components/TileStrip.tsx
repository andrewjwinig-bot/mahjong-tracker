import Tile from './Tile';
import type { TileFace } from '../lib/tileArt';

// A little parade of one of each tile family — custom SVG artwork.
const STRIP: { face: TileFace; char?: string; color?: string }[] = [
  { face: 'crack' },
  { face: 'bam' },
  { face: 'dot' },
  { face: 'dragon', char: '中', color: '#E8455F' },
  { face: 'flower' },
  { face: 'wind', char: '東' },
  { face: 'joker' },
];

export default function TileStrip({ count = 7 }: { count?: number }) {
  return (
    <div className="tile-strip" aria-hidden>
      {STRIP.slice(0, count).map((t, i) => (
        <Tile key={i} face={t.face} char={t.char} color={t.color} size={32} />
      ))}
    </div>
  );
}
