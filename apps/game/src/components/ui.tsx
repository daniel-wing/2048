/**
 * Small shared UI pieces. Plain React Native primitives only — no HTML tags,
 * no CSS classes — so every screen ports to native untouched.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { FONT_STACK, RADIUS_PANEL, RADIUS_PILL, type Theme } from '../theme/palettes';

/** Minimum comfortable touch target. Sized for thumbs from day one. */
export const TOUCH_TARGET = 44;

export function Button({
  label,
  onPress,
  theme,
  variant = 'primary',
  disabled = false,
  style,
  accessibilityHint,
  selected,
}: {
  label: string;
  onPress: () => void;
  theme: Theme;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  /**
   * Marks this button as the chosen one in a group of options.
   *
   * Without it the active choice is signalled by fill alone, so a screen reader
   * announces six identical "button"s with no way to tell which board size or
   * theme is actually selected. Setting it switches the role to `radio`, which
   * is what carries the checked state to assistive tech.
   */
  selected?: boolean;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={selected === undefined ? 'button' : 'radio'}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...(selected === undefined ? {} : { checked: selected }) }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? theme.colors.accent : theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: primary ? 0 : 1,
          opacity: disabled ? 0.6 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          { color: primary ? theme.colors.accentText : theme.colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ScorePill({
  label,
  value,
  theme,
}: {
  label: string;
  value: number;
  theme: Theme;
}) {
  return (
    <View
      style={[styles.pill, { backgroundColor: theme.colors.scoreBg }]}
      accessibilityLabel={`${label} ${value}`}
    >
      <Text style={[styles.pillLabel, { color: theme.colors.scoreText }]}>
        {label.toUpperCase()}
      </Text>
      <Text style={[styles.pillValue, { color: theme.colors.scoreText }]}>{value}</Text>
    </View>
  );
}

/**
 * A round, icon-only button.
 *
 * The glyph is a plain character rather than an SVG or an icon font: it keeps
 * the app dependency-free and ports to native untouched. Latin webfonts do not
 * carry arrows, so the character falls through to the platform font — which is
 * fine, arrows render consistently across system fonts.
 *
 * `accessibilityLabel` is required, not optional: an icon with no text is
 * invisible to a screen reader without it.
 */
export function IconButton({
  glyph,
  accessibilityLabel,
  onPress,
  theme,
  disabled = false,
  accessibilityHint,
  style,
}: {
  glyph: string;
  accessibilityLabel: string;
  onPress: () => void;
  theme: Theme;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: disabled ? 0.6 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.iconGlyph, { color: theme.colors.text }]}>{glyph}</Text>
    </Pressable>
  );
}

/**
 * Style for the bottom navigation chips.
 *
 * Exported as a style rather than a component so the caller can apply it
 * directly to an expo-router `<Link>`. Wrapping a Pressable in `<Link asChild>`
 * looked identical but rendered an anchor with NO href, which silently breaks
 * cmd-click, "open in new tab", "copy link address" and anything that reads the
 * document's links. A styled Link keeps the real href.
 *
 * Deliberately lighter than `Button`: a hairline border and no fill, so it reads
 * as tappable without competing with the primary controls above the board. Bare
 * text links looked like an afterthought and did not connect to the game; a full
 * pill would have pulled focus from "New game".
 *
 * Vertical padding rather than minHeight, because this styles a Text: 12 + 20 +
 * 12 lands exactly on the 44px touch target.
 */
export function navChipStyle(theme: Theme) {
  return [styles.navChip, { borderColor: theme.colors.border, color: theme.colors.text }];
}

export function Card({
  children,
  theme,
  style,
}: {
  children: React.ReactNode;
  theme: Theme;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Row({
  children,
  style,
  accessibilityRole,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Set to "radiogroup" when the row holds a set of mutually exclusive options.
   * Without it, a screen reader reads the options as loose buttons with no
   * indication that they belong together or what the group is for.
   */
  accessibilityRole?: 'radiogroup' | 'toolbar';
  accessibilityLabel?: string;
}) {
  return (
    <View
      style={[styles.row, style]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: TOUCH_TARGET,
    paddingHorizontal: 18,
    // Pill controls, like the site's nav and tags.
    borderRadius: RADIUS_PILL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontFamily: FONT_STACK,
    fontSize: 15,
    fontWeight: '700',
  },
  pill: {
    minWidth: 92,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  pillLabel: {
    fontFamily: FONT_STACK,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    // Was 0.85, which pushed an already-dim label below readable on the dark
    // pill. The label is small caps on a busy background and needs the weight.
    opacity: 0.95,
  },
  pillValue: {
    fontFamily: FONT_STACK,
    fontSize: 20,
    fontWeight: '800',
  },
  iconButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    // A pill radius on a square is a circle.
    borderRadius: RADIUS_PILL,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 20,
    lineHeight: 24,
    // The arrow sits slightly high in most system fonts; nudge it back.
    marginTop: -1,
    includeFontPadding: false,
  },
  navChip: {
    fontFamily: FONT_STACK,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    // 11 + 20 + 11 plus the 1px border top and bottom = exactly the 44px touch
    // target, and exactly Button's height so the two sit flush in a shared row.
    // minHeight is no use here: it does not centre text on a Text element.
    paddingVertical: 11,
    // Tighter than Button's 18 so the four-item bottom row fits one line.
    paddingHorizontal: 14,
    borderRadius: RADIUS_PILL,
    borderWidth: 1,
    textAlign: 'center',
  },
  card: {
    borderRadius: RADIUS_PANEL,
    borderWidth: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
