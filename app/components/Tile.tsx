import { tileSVG, type TileFace } from '../lib/tileArt';

interface Props {
  face: TileFace;
  char?: string;
  color?: string;
  /** For dot tiles: render this many dots (1–9), e.g. leaderboard ranks. */
  count?: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** A single custom mahjong tile (SVG). Body reskins with the theme. */
export default function Tile({ face, char, color, count, size = 34, className, style }: Props) {
  return (
    <span
      className={`tile${className ? ` ${className}` : ''}`}
      style={{ width: size, ...style }}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: tileSVG(face, { char, color, count }) }}
    />
  );
}
