/**
 * Root layout.
 *
 * `GestureHandlerRootView` and `SafeAreaProvider` are mounted from day one:
 * they cost nothing on web and are exactly what prevents notch / home-indicator
 * and gesture bugs when Phase 2 turns this into an iOS app.
 */

// Since SDK 56 expo-router no longer depends on react-navigation and vendors
// its own navigator, so the theming primitives come from expo-router itself.
// Importing them from '@react-navigation/native' is a build error here.
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useTheme } from '../src/theme/useTheme';

export default function RootLayout() {
  const theme = useTheme();

  /**
   * React Navigation paints its own screen background (#f2f2f2 by default),
   * which sits above the page and would hide the site gradient entirely. Handing
   * it our palette is the only way to let a 'transparent' theme background
   * actually be transparent.
   */
  const navigationTheme = useMemo(() => {
    const base = theme.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        primary: theme.colors.accent,
        border: theme.colors.border,
      },
    };
  }, [theme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style={theme.isDark ? 'light' : 'dark'} />
          {/*
            Slot, not Stack.

            A Stack navigator keeps every visited screen mounted and positions
            them `absolute` so it can animate between them. Absolute children
            contribute no height, so the page could not grow with its content:
            long screens overflowed their container and spilled underneath the
            site footer.

            Slot renders the matched route in normal flow, so the document grows
            and scrolls the way every other page on wing.cx does. The cost is
            stack transitions, which a four-screen game embedded in a web page
            has no use for. Titles move to a <Head> in each route.

            Phase 2 note: if native wants real stack gestures, split this file
            into _layout.web.tsx / _layout.native.tsx rather than reintroducing
            the navigator here.
          */}
          <Slot />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
