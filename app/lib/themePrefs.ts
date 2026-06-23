// Color-theme preferences. Themes are just sets of CSS variables toggled via a
// `data-theme` attribute on <html>, so switching reskins the whole app at once.
// Default is the card-table "Felt" scheme.

export type ThemeId =
  | 'bam'
  | 'dot'
  | 'crak'
  | 'dragon'
  | 'flower'
  | 'joker'
  | 'wind'
  | 'felt';

import type { TileFace } from './tileArt';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  tagline: string;
  dark?: boolean;
  /** Premium theme — gated behind Pro. */
  pro?: boolean;
  /** The mahjong tile that represents this theme in the picker. */
  tile: { face: TileFace; char?: string; color?: string };
  /** Optional full-bleed wallpaper image (also previewed on the theme card). */
  wallpaper?: string;
  /** Preview swatch + the browser status-bar (theme-color) page tone. */
  swatch: { brand: string; green: string; accent: string; page: string };
}

export const DEFAULT_THEME: ThemeId = 'felt';

export const THEMES: ThemeDef[] = [
  {
    id: 'bam',
    name: 'Bam',
    tagline: 'Bamboo green',
    tile: { face: 'bam' },
    wallpaper: '/patterns/bg-bam.svg',
    swatch: { brand: '#15803D', green: '#10B39A', accent: '#F5A524', page: '#E9F4EC' },
  },
  {
    id: 'dot',
    name: 'Dot',
    tagline: 'Circle blue',
    tile: { face: 'dot' },
    wallpaper: '/patterns/bg-dot.svg',
    swatch: { brand: '#1E6FCB', green: '#10B39A', accent: '#F5A524', page: '#EBF1F4' },
  },
  {
    id: 'crak',
    name: 'Crak',
    tagline: 'Character red',
    tile: { face: 'crack' },
    wallpaper: '/patterns/bg-crak.svg',
    swatch: { brand: '#C0392B', green: '#10B39A', accent: '#F5A524', page: '#F6EEDD' },
  },
  {
    id: 'dragon',
    name: 'Dragon',
    tagline: 'Emerald & gold',
    pro: true,
    tile: { face: 'dragon', char: '中', color: '#C8302C' },
    wallpaper: '/patterns/bg-dragon.svg',
    swatch: { brand: '#C8302C', green: '#10B39A', accent: '#F5A524', page: '#E7F0EA' },
  },
  {
    id: 'flower',
    name: 'Flower',
    tagline: 'Petal pink',
    tile: { face: 'flower' },
    wallpaper: '/patterns/bg-flower.svg',
    swatch: { brand: '#DB2777', green: '#10B39A', accent: '#F5A524', page: '#FAECF3' },
  },
  {
    id: 'joker',
    name: 'Joker',
    tagline: 'Wild violet',
    pro: true,
    tile: { face: 'joker' },
    wallpaper: '/patterns/bg-joker.svg',
    swatch: { brand: '#6A3FC0', green: '#10B39A', accent: '#F5A524', page: '#F0EBFA' },
  },
  {
    id: 'wind',
    name: 'Wind',
    tagline: 'Breezy teal',
    pro: true,
    tile: { face: 'wind', char: '風', color: '#2E7D8C' },
    wallpaper: '/patterns/bg-wind.svg',
    swatch: { brand: '#2E7D8C', green: '#10B39A', accent: '#F5A524', page: '#EAF2F3' },
  },
  {
    id: 'felt',
    name: 'Felt',
    tagline: 'Card-table green',
    tile: { face: 'flower', color: '#C0392B' },
    wallpaper: '/patterns/bg-felt.svg',
    swatch: { brand: '#C0392B', green: '#10B39A', accent: '#F5A524', page: '#E8F1EA' },
  },
];

const KEY = 'mahj.theme';

export function getStoredTheme(): ThemeId {
  try {
    const t = localStorage.getItem(KEY) as ThemeId | null;
    return t && THEMES.some((x) => x.id === t) ? t : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyTheme(id: ThemeId): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  if (id === DEFAULT_THEME) el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', id);
  const meta = document.querySelector('meta[name="theme-color"]');
  const def = THEMES.find((x) => x.id === id);
  if (meta && def) meta.setAttribute('content', def.swatch.page);
}

export function setTheme(id: ThemeId): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
  applyTheme(id);
}
