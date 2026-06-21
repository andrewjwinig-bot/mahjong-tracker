import { tileSVG, type TileFace } from '../lib/tileArt';

interface Props {
  face: TileFace;
  char?: string;
  color?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** A single custom mahjong tile (SVG). Body reskins with the theme. */
export default function Tile({ face, char, color, size = 34, className, style }: Props) {
  return (
    <span
      className={`tile${className ? ` ${className}` : ''}`}
      style={{ width: size, ...style }}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: tileSVG(face, { char, color }) }}
    />
  );
}
