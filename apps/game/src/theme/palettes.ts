/**
 * Theme palettes.
 *
 * Multiple themes are a mandatory launch feature, not a nicety: together with
 * variable board sizes they are the substantive differentiators cited in the
 * App Store review notes (Guideline 4.3).
 *
 * Colours live here as plain data so components never hard-code a hex value.
 */

export type ThemeId = 'wing' | 'classic' | 'dark' | 'contrast' | 'neon' | 'forest';

export type TileStyle = { bg: string; fg: string };

export type Theme = {
  id: ThemeId;
  label: string;
  /** Drives the status bar and the browser's colour-scheme hint. */
  isDark: boolean;
  colors: {
    /**
     * May be 'transparent' when the page itself paints the background (the
     * Wing theme lets the site's radial gradient show through). Native has no
     * page behind the app, so it uses `backgroundFallback` instead.
     */
    background: string;
    surface: string;
    boardBackground: string;
    cellBackground: string;
    text: string;
    textMuted: string;
    accent: string;
    accentText: string;
    overlay: string;
    border: string;
    /**
     * Score/best pills. These need their own pair because the pill sits on the
     * board's dark backing, where the theme's normal text colour may be
     * unreadable — that is exactly how the Wing pills ended up navy-on-navy.
     */
    scoreBg: string;
    scoreText: string;
  };
  /**
   * Solid colour to paint behind the app on native, where there is no HTML
   * body to carry a gradient. Phase 2 reads this; web ignores it.
   */
  backgroundFallback: string;
  /** Tile colours by value; `fallback` covers anything above 2048. */
  tiles: Record<number, TileStyle>;
  fallbackTile: TileStyle;
};

/**
 * The house theme, matching wing.cx.
 *
 * Site tokens this is built from: the radial background gradient
 * (#306d8c -> #275973), white text, glassy panels at rgba(0,0,0,0.16) with
 * 18px radii, and pill controls.
 *
 * The tile ramp runs cool to warm: blues for 2-64, then a hard switch to amber
 * and orange from 128 up. That crossover is the visual milestone the classic
 * game gets from its jump to gold, and it uses both halves of the brand palette
 * for something meaningful rather than decorative.
 *
 * Every pairing in this file is checked by `node scripts/check-contrast.mjs`,
 * which fails the build on anything under 4.5:1 for body text or 3:1 for tile
 * numerals. That is why the mid-blues and mid-ambers take navy text rather than
 * white — white on #00A7E1 is only 2.8:1 and fails.
 *
 * The gradient was darkened from the site's original #4a9ec8 for exactly this
 * reason: white on it measured 2.99:1, so the default theme failed at its most
 * basic job. wing.cx itself was changed to match.
 */
const wing: Theme = {
  id: 'wing',
  label: 'Wing',
  isDark: true,
  colors: {
    // The page paints the site's radial gradient; the app sits on top of it.
    background: 'transparent',
    surface: 'rgba(0, 0, 0, 0.16)',
    boardBackground: 'rgba(10, 22, 52, 0.62)',
    cellBackground: 'rgba(255, 255, 255, 0.10)',
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.86)',
    // Orange is reserved entirely for high-value tiles. The chrome uses the
    // site's own control language instead: a white primary pill with dark text,
    // and translucent secondary pills — exactly like wing.cx's nav and buttons.
    accent: '#ffffff',
    accentText: '#16233f',
    overlay: 'rgba(9, 20, 48, 0.74)',
    border: 'rgba(255, 255, 255, 0.16)',
    // Matches the site's --pill-bg, with white numerals for real contrast.
    scoreBg: 'rgba(0, 0, 0, 0.22)',
    scoreText: '#ffffff',
  },
  backgroundFallback: '#306d8c',
  tiles: {
    2: { bg: '#eaf4fb', fg: '#0f1b3d' },
    4: { bg: '#c7e5f6', fg: '#0f1b3d' },
    8: { bg: '#8fd4f0', fg: '#0f1b3d' },
    16: { bg: '#4fc0ea', fg: '#0f1b3d' },
    32: { bg: '#00a7e1', fg: '#0f1b3d' },
    64: { bg: '#0474ba', fg: '#ffffff' },
    // Crossover into the warm half of the palette.
    128: { bg: '#ffce7a', fg: '#0f1b3d' },
    256: { bg: '#ffa630', fg: '#0f1b3d' },
    512: { bg: '#f7941e', fg: '#0f1b3d' },
    1024: { bg: '#ec6608', fg: '#ffffff' },
    2048: { bg: '#dc4e05', fg: '#ffffff' },
    4096: { bg: '#c04304', fg: '#ffffff' },
    8192: { bg: '#9e3703', fg: '#ffffff' },
  },
  fallbackTile: { bg: '#7a2a02', fg: '#fff3e6' },
};

const classic: Theme = {
  id: 'classic',
  label: 'Classic',
  isDark: false,
  colors: {
    background: '#faf8ef',
    surface: '#eee4da',
    boardBackground: '#bbada0',
    cellBackground: '#cdc1b4',
    text: '#776e65',
    textMuted: '#6b635b',
    accent: '#6d5c4c',
    accentText: '#f9f6f2',
    overlay: 'rgba(238, 228, 218, 0.73)',
    border: '#d8cec4',
    scoreBg: '#7a6c60',
    scoreText: '#f9f6f2',
  },
  backgroundFallback: '#faf8ef',
  tiles: {
    2: { bg: '#eee4da', fg: '#776e65' },
    4: { bg: '#ede0c8', fg: '#776e65' },
    8: { bg: '#f2b179', fg: '#5c554e' },
    16: { bg: '#f59563', fg: '#5c554e' },
    32: { bg: '#f79372', fg: '#4a443e' },
    64: { bg: '#f87a5c', fg: '#4a443e' },
    128: { bg: '#edcf72', fg: '#5c554e' },
    256: { bg: '#edcc61', fg: '#5c554e' },
    512: { bg: '#edc850', fg: '#5c554e' },
    1024: { bg: '#edc53f', fg: '#5c554e' },
    2048: { bg: '#edc22e', fg: '#5c554e' },
    4096: { bg: '#c9a62c', fg: '#3f3a33' },
    8192: { bg: '#9a7d1f', fg: '#faf8ef' },
  },
  fallbackTile: { bg: '#3c3a32', fg: '#f9f6f2' },
};

const dark: Theme = {
  id: 'dark',
  label: 'Dark',
  isDark: true,
  colors: {
    background: '#12100e',
    surface: '#1f1c19',
    boardBackground: '#2b2622',
    cellBackground: '#3a332e',
    text: '#f4efe9',
    textMuted: '#a89e94',
    accent: '#c9a227',
    accentText: '#12100e',
    overlay: 'rgba(18, 16, 14, 0.82)',
    border: '#3a332e',
    scoreBg: '#2b2622',
    scoreText: '#f4efe9',
  },
  backgroundFallback: '#12100e',
  tiles: {
    2: { bg: '#4b433c', fg: '#f4efe9' },
    4: { bg: '#5c5148', fg: '#f4efe9' },
    8: { bg: '#b4703c', fg: '#fff8f0' },
    16: { bg: '#c47a3c', fg: '#fff8f0' },
    32: { bg: '#cf6a45', fg: '#fff8f0' },
    64: { bg: '#d4512c', fg: '#fff8f0' },
    128: { bg: '#c9a227', fg: '#1a1712' },
    256: { bg: '#d1aa22', fg: '#1a1712' },
    512: { bg: '#dcb41d', fg: '#1a1712' },
    1024: { bg: '#e6bd18', fg: '#1a1712' },
    2048: { bg: '#f0c613', fg: '#1a1712' },
    4096: { bg: '#d9b210', fg: '#1a1712' },
    8192: { bg: '#b3910b', fg: '#1a1712' },
  },
  fallbackTile: { bg: '#7c5cff', fg: '#ffffff' },
};

const contrast: Theme = {
  id: 'contrast',
  label: 'High contrast',
  isDark: true,
  colors: {
    background: '#000000',
    surface: '#111111',
    boardBackground: '#1a1a1a',
    cellBackground: '#2e2e2e',
    text: '#ffffff',
    textMuted: '#c9c9c9',
    accent: '#ffd400',
    accentText: '#000000',
    overlay: 'rgba(0, 0, 0, 0.88)',
    border: '#4d4d4d',
    scoreBg: '#1a1a1a',
    scoreText: '#ffffff',
  },
  backgroundFallback: '#000000',
  tiles: {
    2: { bg: '#ffffff', fg: '#000000' },
    4: { bg: '#d4d4d4', fg: '#000000' },
    8: { bg: '#4dc3ff', fg: '#000000' },
    16: { bg: '#00a3ff', fg: '#000000' },
    32: { bg: '#00e0a4', fg: '#000000' },
    64: { bg: '#00c853', fg: '#000000' },
    128: { bg: '#ffd400', fg: '#000000' },
    256: { bg: '#ffaa00', fg: '#000000' },
    512: { bg: '#ff7300', fg: '#000000' },
    1024: { bg: '#ff3d5a', fg: '#ffffff' },
    2048: { bg: '#ff0040', fg: '#ffffff' },
    4096: { bg: '#ff7ad9', fg: '#000000' },
    8192: { bg: '#c400ff', fg: '#ffffff' },
  },
  fallbackTile: { bg: '#7b2fff', fg: '#ffffff' },
};

const neon: Theme = {
  id: 'neon',
  label: 'Neon',
  isDark: true,
  colors: {
    background: '#0b0f1a',
    surface: '#131a2b',
    boardBackground: '#161f36',
    cellBackground: '#1e2a47',
    text: '#e6f1ff',
    textMuted: '#8fa3c8',
    accent: '#22d3ee',
    accentText: '#04121a',
    overlay: 'rgba(11, 15, 26, 0.85)',
    border: '#26334f',
    scoreBg: '#161f36',
    scoreText: '#e6f1ff',
  },
  backgroundFallback: '#0b0f1a',
  tiles: {
    2: { bg: '#243352', fg: '#cfe4ff' },
    4: { bg: '#2b4370', fg: '#cfe4ff' },
    8: { bg: '#3b82f6', fg: '#04121a' },
    16: { bg: '#22d3ee', fg: '#04121a' },
    32: { bg: '#2dd4bf', fg: '#04121a' },
    64: { bg: '#34d399', fg: '#04121a' },
    128: { bg: '#a78bfa', fg: '#0b0f1a' },
    256: { bg: '#c084fc', fg: '#0b0f1a' },
    512: { bg: '#e879f9', fg: '#0b0f1a' },
    1024: { bg: '#f472b6', fg: '#0b0f1a' },
    2048: { bg: '#fb7185', fg: '#0b0f1a' },
    4096: { bg: '#fb923c', fg: '#0b0f1a' },
    8192: { bg: '#fde047', fg: '#0b0f1a' },
  },
  fallbackTile: { bg: '#a3e635', fg: '#0b0f1a' },
};

const forest: Theme = {
  id: 'forest',
  label: 'Forest',
  isDark: false,
  colors: {
    background: '#f3f7f0',
    surface: '#e4ede0',
    boardBackground: '#a3b899',
    cellBackground: '#bccdb4',
    text: '#3f4a3a',
    textMuted: '#50594b',
    accent: '#44603a',
    accentText: '#f7fbf5',
    overlay: 'rgba(228, 237, 224, 0.8)',
    border: '#cad8c3',
    scoreBg: '#5c7052',
    scoreText: '#f7fbf5',
  },
  backgroundFallback: '#f3f7f0',
  tiles: {
    2: { bg: '#e4ede0', fg: '#3f4a3a' },
    4: { bg: '#d3e2cc', fg: '#3f4a3a' },
    8: { bg: '#a8c99a', fg: '#25301f' },
    16: { bg: '#8fbb7d', fg: '#25301f' },
    32: { bg: '#74ad60', fg: '#22301b' },
    64: { bg: '#5c9c48', fg: '#f7fbf5' },
    128: { bg: '#e0b96a', fg: '#3f3320' },
    256: { bg: '#d9ad50', fg: '#3f3320' },
    512: { bg: '#d1a137', fg: '#3f3320' },
    1024: { bg: '#c8941f', fg: '#2b1f04' },
    2048: { bg: '#b8830f', fg: '#fffaf0' },
    4096: { bg: '#a8791a', fg: '#fff8e8' },
    8192: { bg: '#7e5a12', fg: '#fff8e8' },
  },
  fallbackTile: { bg: '#4c3a0c', fg: '#fff8e8' },
};

export const THEMES: Record<ThemeId, Theme> = {
  wing,
  classic,
  dark,
  contrast,
  neon,
  forest,
};

/** Wing leads: it is the house theme and the default. */
export const THEME_LIST: Theme[] = [wing, classic, dark, contrast, neon, forest];

/**
 * Typography.
 *
 * Mirrors the wing.cx stack. The font is deliberately NOT fetched from Google
 * Fonts the way the main site does — this app's promise is that it makes zero
 * network requests, and a webfont request would hand the user's IP to a third
 * party on every load. Where Plus Jakarta Sans is not already available the
 * stack falls through to the platform UI font, which is a close enough match in
 * weight and proportion for tile numerals.
 */
export const FONT_STACK =
  "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

/** Radii lifted from the site: 18px panels, fully-round pills. */
export const RADIUS_PANEL = 18;
export const RADIUS_PILL = 9999;

export function tileStyle(theme: Theme, value: number): TileStyle {
  return theme.tiles[value] ?? theme.fallbackTile;
}

/**
 * Larger numbers need smaller type to fit the tile. Expressed as a multiplier
 * of the computed tile font size so it scales with the board.
 */
export function tileFontScale(value: number): number {
  if (value >= 10000) return 0.42;
  if (value >= 1000) return 0.52;
  if (value >= 100) return 0.64;
  return 0.78;
}
