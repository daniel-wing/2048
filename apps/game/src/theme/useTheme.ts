/**
 * Resolves the active theme from the user's preference and the OS colour
 * scheme. `useColorScheme` works identically on web and native, so no platform
 * branching is needed for that part.
 */

import { useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { useSettingsStore } from '../stores/settingsStore';
import { THEMES, type Theme } from './palettes';

export function useTheme(): Theme {
  const preference = useSettingsStore((s) => s.themePreference);
  const scheme = useColorScheme();

  const theme = useMemo(() => {
    // 'system' follows the OS between the two classic looks. The default is
    // 'wing', which is a single fixed look because wing.cx itself has no dark
    // variant — the game should match the site it is published on.
    if (preference === 'system') {
      return scheme === 'dark' ? THEMES.dark : THEMES.classic;
    }
    return THEMES[preference] ?? THEMES.wing;
  }, [preference, scheme]);

  return useMemo(() => {
    /*
      A 'transparent' background means "let the page behind show through", which
      only exists on web — there the site's gradient is painted on the body.

      Native has nothing behind the app, so a transparent background left the
      whole UI on the system default white or black, with tile and text colours
      tuned for a mid-blue backdrop. Every theme carries a solid
      `backgroundFallback` for exactly this; until now nothing read it.
    */
    if (Platform.OS === 'web' || theme.colors.background !== 'transparent') return theme;

    return {
      ...theme,
      colors: { ...theme.colors, background: theme.backgroundFallback },
    };
  }, [theme]);
}
