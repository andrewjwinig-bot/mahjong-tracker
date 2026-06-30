// A table's icon: a painterly motif PNG rendered on the shared "paper-tile"
// shell (white→cream gradient, inset bottom shadow, rounded, selectable border).
// One component used everywhere a table icon appears so a table looks identical
// across the picker, list rows, detail header, lobby/invite cards, in-game
// header and notifications. Icons are stored as the motif KEY string.

export const TABLE_MOTIFS = [
  'crane_fit',
  'bamboo_stalk',
  'dot_target',
  'wan',
  'dragon',
  'fa_green',
  'flower_peony',
  'flower_lotus',
  'special_koi',
  'star',
] as const;

export type TableMotif = (typeof TABLE_MOTIFS)[number];

const FALLBACK: TableMotif = 'crane_fit';
const MOTIF_SET = new Set<string>(TABLE_MOTIFS);

// Map legacy icon keys (tables once stored a TileAvatar face, e.g. 'crack',
// 'dot', 'flower') onto the nearest new motif so old/created tables still show
// something sensible after the switch.
const LEGACY: Record<string, TableMotif> = {
  crane: 'crane_fit',
  peony: 'flower_peony',
  wheel_flower: 'flower_peony',
  flower: 'flower_peony',
  plum: 'flower_lotus',
  bam: 'bamboo_stalk',
  bamboo_three: 'bamboo_stalk',
  dot: 'dot_target',
  dot_nine: 'dot_target',
  crack: 'wan',
  chung_red: 'dragon',
  joker: 'star',
  frame_tall: 'wan',
};

/** Resolve any stored icon value (motif key or legacy key) to a real motif. */
export function normalizeMotif(key: string | undefined | null): TableMotif {
  if (!key) return FALLBACK;
  if (MOTIF_SET.has(key)) return key as TableMotif;
  return LEGACY[key] ?? FALLBACK;
}

export default function TableIcon({
  motif,
  size,
  selected = false,
  className,
}: {
  /** Motif key string (or a legacy key, which is normalized). */
  motif: string;
  /** Tile width in px. Omit to fill the parent (used by the grid picker). */
  size?: number;
  selected?: boolean;
  className?: string;
}) {
  const key = normalizeMotif(motif);
  const style: React.CSSProperties = size != null ? { width: size } : { width: '100%' };
  // Selected state is the red frame only — no check badge (per design note).
  return (
    <span
      className={`tbicon${className ? ` ${className}` : ''}`}
      data-selected={selected || undefined}
      style={style}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/table-motifs/${key}.png`} alt="" draggable={false} />
    </span>
  );
}
