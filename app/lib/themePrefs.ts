// Color-theme preferences. Themes are just sets of CSS variables toggled via a
// `data-theme` attribute on <html>, so switching reskins the whole app at once.
// Default is the gender-neutral "Jade" scheme.

export type ThemeId =
  | 'jade'
  | 'bam'
  | 'dot'
  | 'crak'
  | 'dragon'
  | 'flower'
  | 'joker'
  | 'midnight';

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
  /** Preview swatch + the browser status-bar (theme-color) page tone. */
  swatch: { brand: string; green: string; accent: string; page: string };
}

export const DEFAULT_THEME: ThemeId = 'jade';

export const THEMES: ThemeDef[] = [
  {
    id: 'jade',
    name: 'Jade',
    tagline: 'Clean & neutral',
    tile: { face: 'wind', char: '東', color: '#0EAD96' },
    swatch: { brand: '#0EAD96', green: '#2BB673', accent: '#FF6B5C', page: '#F7F5EF' },
  },
  {
    id: 'bam',
    name: 'Bam',
    tagline: 'Bamboo green',
    tile: { face: 'bam' },
    swatch: { brand: '#2E9E50', green: '#2BB673', accent: '#F2784B', page: '#F0F5E9' },
  },
  {
    id: 'dot',
    name: 'Dot',
    tagline: 'Circle blue',
    tile: { face: 'dot' },
    swatch: { brand: '#1E73C4', green: '#1FB7A6', accent: '#FF7A4D', page: '#EEF4FB' },
  },
  {
    id: 'crak',
    name: 'Crak',
    tagline: 'Character red',
    tile: { face: 'crack' },
    swatch: { brand: '#D23B4E', green: '#23B196', accent: '#E0A02B', page: '#FCEDEC' },
  },
  {
    id: 'dragon',
    name: 'Dragon',
    tagline: 'Emerald & gold',
    pro: true,
    tile: { face: 'dragon', char: '中', color: '#D23B4E' },
    swatch: { brand: '#0F8F6E', green: '#2BB673', accent: '#D23B4E', page: '#F4EFE1' },
  },
  {
    id: 'flower',
    name: 'Flower',
    tagline: 'Petal pink',
    tile: { face: 'flower' },
    swatch: { brand: '#E84C8A', green: '#2BBE9E', accent: '#F2A93C', page: '#FFF0F6' },
  },
  {
    id: 'joker',
    name: 'Joker',
    tagline: 'Wild violet',
    pro: true,
    tile: { face: 'joker' },
    swatch: { brand: '#7C4DE0', green: '#18C39A', accent: '#F5478B', page: '#F5F2FD' },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    tagline: 'Dark & neon',
    dark: true,
    pro: true,
    tile: { face: 'dragon', char: '白', color: '#5AA2FF' },
    swatch: { brand: '#2DD4BF', green: '#34D399', accent: '#FF6B81', page: '#141826' },
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
