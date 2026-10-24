// Design system — bright, playful, sticker-planner energy (think the printed
// "2026 Mahjong Hand Tracker": soft pink, coral-red, with blue + green pops).
// Single source of truth for colors so pages don't reinvent chip/accent styling.

export const COLORS = {
  primary: '#E8455F', // brand coral-red (logo)
  secondary: '#23B196', // green
  accent: '#E8455F', // coral-red pop — I GOT MAHJ / Share
  ink: '#2C3A57', // deep navy
  page: '#FCE7EC', // soft pink
  card: '#FFFFFF',
  muted: '#A98E98',
  hairline: '#F3D7DF',
} as const;

/** Rotating per-category accent themes (used for avatars + the social feed). */
export interface CategoryTheme {
  /** Soft pill / tint background. */
  bg: string;
  /** Strong accent for the pill text, counters, progress. */
  accent: string;
}

export const CATEGORY_THEMES: CategoryTheme[] = [
  { bg: '#FBD9E0', accent: '#E8455F' }, // coral-red
  { bg: '#D5F1E9', accent: '#23B196' }, // green
  { bg: '#D9E6FB', accent: '#3B7DD8' }, // blue
  { bg: '#EAE6FC', accent: '#7C6BE6' }, // violet
  { bg: '#FFF1D9', accent: '#E59A2B' }, // amber
  { bg: '#FFE0DB', accent: '#F0654F' }, // coral
];

/** Stable theme for a category — same category always gets the same color. */
export function themeForCategory(categories: string[], category: string): CategoryTheme {
  const i = Math.max(0, categories.indexOf(category));
  return CATEGORY_THEMES[i % CATEGORY_THEMES.length];
}

/**
 * Decorative per-group coloring for a notation string. Splits on whitespace and
 * cycles a theme-aware color *class* (nc0–nc3) by group position. Positional /
 * decorative only — not suit-accurate, carries no game meaning.
 *
 * A hand may print two acceptable forms separated by "or" (e.g.
 * "FF 2025 2025 DDDD or FF 222 55 555 DDDD"). We keep both — rendering "or" as a
 * muted separator (class "nc-or") and restarting the color cycle after it so the
 * second form reads as its own sequence.
 */
export function colorNotation(notation: string): { text: string; cls: string }[] {
  let i = 0;
  return notation
    .trim()
    .split(/\s+/)
    .map((text) => {
      if (/^-?or-?$/i.test(text)) {
        i = 0;
        return { text: 'or', cls: 'nc-or' };
      }
      const out = { text, cls: `nc${i % 4}` };
      i += 1;
      return out;
    });
}
