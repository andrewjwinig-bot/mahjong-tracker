// Color-theme preferences. Themes are just sets of CSS variables toggled via a
// `data-theme` attribute on <html>, so switching reskins the whole app at once.
// Default is the gender-neutral "Jade" scheme.

export type ThemeId = 'jade' | 'bubblegum' | 'electric' | 'sunset' | 'midnight';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  tagline: string;
  dark?: boolean;
  /** Preview swatch + the browser status-bar (theme-color) page tone. */
  swatch: { brand: string; green: string; accent: string; page: string };
}

export const DEFAULT_THEME: ThemeId = 'jade';

export const THEMES: ThemeDef[] = [
  {
    id: 'jade',
    name: 'Jade',
    tagline: 'Bold & neutral',
    swatch: { brand: '#0EAD96', green: '#2BB673', accent: '#FF6B5C', page: '#FBF8F1' },
  },
  {
    id: 'electric',
    name: 'Electric',
    tagline: 'Punchy violet',
    swatch: { brand: '#6C4CE0', green: '#18C39A', accent: '#F5478B', page: '#F5F4FC' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    tagline: 'Warm & toasty',
    swatch: { brand: '#F2682C', green: '#2DB39A', accent: '#E63462', page: '#FFF6EC' },
  },
  {
    id: 'bubblegum',
    name: 'Bubblegum',
    tagline: 'Sweet & pink',
    swatch: { brand: '#E8455F', green: '#23B196', accent: '#F0654F', page: '#FCE7EC' },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    tagline: 'Dark & neon',
    dark: true,
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
