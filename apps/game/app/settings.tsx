/**
 * Settings.
 *
 * Board size and themes are mandatory launch features — they are the
 * differentiators the App Store review notes point at, so they get first-class
 * placement here rather than being buried.
 */

import { MAX_SIZE, MIN_SIZE } from '@2048/engine';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import React, { useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageScroll } from '../src/components/PageScroll';
import { Button, Card, Row, TOUCH_TARGET } from '../src/components/ui';
import { useGameStore } from '../src/stores/gameStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useStatsStore } from '../src/stores/statsStore';
import { THEME_LIST } from '../src/theme/palettes';
import { useTheme } from '../src/theme/useTheme';

const SIZES = Array.from({ length: MAX_SIZE - MIN_SIZE + 1 }, (_, i) => MIN_SIZE + i);

const UNDO_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'Off', value: 0 },
  { label: 'One move', value: 1 },
  { label: 'Unlimited', value: -1 },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const settings = useSettingsStore();
  const newGame = useGameStore((s) => s.newGame);
  const resetEverything = useGameStore((s) => s.resetEverything);
  const resetStats = useStatsStore((s) => s.resetStats);
  const currentSize = useGameStore((s) => s.game.size);
  const currentScore = useGameStore((s) => s.game.score);

  const [confirmingSize, setConfirmingSize] = useState<number | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  /**
   * Changing size starts a fresh game, so it destroys the current one — and
   * `newGame` clears the history, so undo cannot bring it back.
   *
   * Two guards. Re-picking the size that is already active does nothing at all:
   * the chip reads as selected, so tapping it looks like a no-op and used to
   * silently bin the game. And when there is progress to lose, it asks first.
   */
  function chooseSize(size: number) {
    if (size === currentSize) return;

    if (currentScore > 0 && confirmingSize !== size) {
      setConfirmingSize(size);
      return;
    }

    setConfirmingSize(null);
    settings.setSize(size);
    newGame(size);
  }

  /** Irreversible: stats, every best score, all settings and the live game. */
  function resetAll() {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    setConfirmingReset(false);
    settings.resetSettings();
    resetStats();
    resetEverything();
  }

  return (
    <PageScroll
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
      ]}
    >
      {/* Route titles live here now that the layout uses Slot. */}
      <Head>
        <title>Settings · 2048</title>
        <meta name="description" content="Board size, themes, undo and accessibility options." />
      </Head>

      <View style={styles.inner}>
        <Row style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
          <Link href="/" style={[styles.link, { color: theme.colors.accent }]}>
            Done
          </Link>
        </Row>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Board size</Text>
          <Text style={[styles.help, { color: theme.colors.textMuted }]}>
            Anything from a quick 3×3 to a sprawling 8×8. Changing size starts a new game.
          </Text>
          {confirmingSize !== null ? (
            <Text style={[styles.warning, { color: theme.colors.text }]}>
              Switching to {confirmingSize}×{confirmingSize} starts a new game and discards
              your current one, worth {currentScore} points. Tap it again to confirm.
            </Text>
          ) : null}
          <Row style={styles.wrapRow} accessibilityRole="radiogroup" accessibilityLabel="Board size">
            {SIZES.map((size) => (
              <Button
                key={size}
                label={`${size}×${size}`}
                onPress={() => chooseSize(size)}
                theme={theme}
                variant={size === currentSize ? 'primary' : 'secondary'}
                selected={size === currentSize}
                style={styles.chip}
              />
            ))}
          </Row>
        </Card>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Theme</Text>
          <Text style={[styles.help, { color: theme.colors.textMuted }]}>
            Wing is the house look. Pick System to follow your device instead.
          </Text>
          <Row style={styles.wrapRow} accessibilityRole="radiogroup" accessibilityLabel="Theme">
            <Button
              label="System"
              onPress={() => settings.setThemePreference('system')}
              theme={theme}
              variant={settings.themePreference === 'system' ? 'primary' : 'secondary'}
              selected={settings.themePreference === 'system'}
              style={styles.chip}
            />
            {THEME_LIST.map((t) => (
              <Button
                key={t.id}
                label={t.label}
                onPress={() => settings.setThemePreference(t.id)}
                theme={theme}
                variant={settings.themePreference === t.id ? 'primary' : 'secondary'}
                selected={settings.themePreference === t.id}
                style={styles.chip}
              />
            ))}
          </Row>
        </Card>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Undo</Text>
          <Row style={styles.wrapRow} accessibilityRole="radiogroup" accessibilityLabel="Undo depth">
            {UNDO_OPTIONS.map((option) => (
              <Button
                key={option.label}
                label={option.label}
                onPress={() => settings.setUndoDepth(option.value)}
                theme={theme}
                variant={settings.undoDepth === option.value ? 'primary' : 'secondary'}
                selected={settings.undoDepth === option.value}
                style={styles.chip}
              />
            ))}
          </Row>
        </Card>

        <Card theme={theme}>
          <Row style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Reduce motion
              </Text>
              <Text style={[styles.help, { color: theme.colors.textMuted }]}>
                Turn off tile sliding and pop animations.
              </Text>
            </View>
            <Switch
              value={settings.reducedMotion}
              onValueChange={settings.setReducedMotion}
              accessibilityLabel="Reduce motion"
              // React Native Web renders a 20x40 switch by default, against the
              // 44px target the rest of the app keeps to.
              style={styles.switch}
            />
          </Row>

          {Platform.OS !== 'web' ? (
            <Row style={[styles.switchRow, styles.switchDivider]}>
              <View style={styles.switchLabel}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Haptics</Text>
                <Text style={[styles.help, { color: theme.colors.textMuted }]}>
                  Vibrate on merges and game over.
                </Text>
              </View>
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={settings.setHapticsEnabled}
                accessibilityLabel="Haptics"
                style={styles.switch}
              />
            </Row>
          ) : null}
        </Card>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Data</Text>
          <Text style={[styles.help, { color: theme.colors.textMuted }]}>
            Everything is stored on this device only. Nothing is ever uploaded.
          </Text>
          {confirmingReset ? (
            <Text style={[styles.warning, { color: theme.colors.text }]}>
              This erases your statistics, every best score, all settings and the game in
              progress. It cannot be undone.
            </Text>
          ) : null}
          <Button
            label={confirmingReset ? 'Yes, erase everything' : 'Reset all data'}
            onPress={resetAll}
            theme={theme}
            variant="secondary"
            style={styles.resetButton}
            accessibilityHint={
              confirmingReset ? 'Permanently erases all saved data' : undefined
            }
          />
        </Card>
      </View>
    </PageScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inner: {
    width: '100%',
    maxWidth: 520,
    gap: 14,
  },
  header: {
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  link: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  help: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
  },
  wrapRow: {
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
  },
  switchRow: {
    justifyContent: 'space-between',
    gap: 12,
    // Gives the row itself the full touch height even though the control
    // inside it is shorter.
    minHeight: TOUCH_TARGET,
  },
  switch: {
    transform: [{ scale: 1.35 }],
    marginRight: 6,
  },
  switchLabel: {
    flex: 1,
  },
  switchDivider: {
    marginTop: 14,
  },
  resetButton: {
    alignSelf: 'flex-start',
  },
  warning: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    marginBottom: 10,
  },
});
