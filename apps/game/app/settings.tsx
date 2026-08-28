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
import { useDocumentTitle } from '../src/i18n/useDocumentTitle';
import { useT } from '../src/i18n/useT';
import { useGameStore } from '../src/stores/gameStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useStatsStore } from '../src/stores/statsStore';
import { THEME_LIST } from '../src/theme/palettes';
import { useTheme } from '../src/theme/useTheme';

const SIZES = Array.from({ length: MAX_SIZE - MIN_SIZE + 1 }, (_, i) => MIN_SIZE + i);

export default function SettingsScreen() {
  const theme = useTheme();
  const t = useT();
  useDocumentTitle(t('meta.settings.title'));
  const insets = useSafeAreaInsets();

  const settings = useSettingsStore();
  const newGame = useGameStore((s) => s.newGame);
  const resetEverything = useGameStore((s) => s.resetEverything);
  const resetStats = useStatsStore((s) => s.resetStats);
  const currentSize = useGameStore((s) => s.game.size);
  const currentScore = useGameStore((s) => s.game.score);

  const undoOptions = [
    { label: t('settings.undo.off'), value: 0 },
    { label: t('settings.undo.one'), value: 1 },
    { label: t('settings.undo.unlimited'), value: -1 },
  ];

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
        <title>{t('meta.settings.title')}</title>
        <meta name="description" content={t('settings.size.help')} />
      </Head>

      <View style={styles.inner}>
        <Row style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('settings.title')}</Text>
          <Link href="/" style={[styles.link, { color: theme.colors.accent }]}>
            {t('nav.done')}
          </Link>
        </Row>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('settings.size.title')}</Text>
          <Text style={[styles.help, { color: theme.colors.textMuted }]}>
            {t('settings.size.help')}
          </Text>
          {confirmingSize !== null ? (
            <Text style={[styles.warning, { color: theme.colors.text }]}>
              {t('settings.size.confirm', { size: confirmingSize, score: currentScore })}
            </Text>
          ) : null}
          <Row style={styles.wrapRow} accessibilityRole="radiogroup" accessibilityLabel={t('settings.size.title')}>
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
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('settings.theme.title')}</Text>
          <Text style={[styles.help, { color: theme.colors.textMuted }]}>
            {t('settings.theme.help')}
          </Text>
          <Row style={styles.wrapRow} accessibilityRole="radiogroup" accessibilityLabel={t('settings.theme.title')}>
            <Button
              label={t('settings.theme.system')}
              onPress={() => settings.setThemePreference('system')}
              theme={theme}
              variant={settings.themePreference === 'system' ? 'primary' : 'secondary'}
              selected={settings.themePreference === 'system'}
              style={styles.chip}
            />
            {THEME_LIST.map((th) => (
              <Button
                key={th.id}
                label={t(`theme.${th.id}` as 'theme.wing')}
                onPress={() => settings.setThemePreference(th.id)}
                theme={theme}
                variant={settings.themePreference === th.id ? 'primary' : 'secondary'}
                selected={settings.themePreference === th.id}
                style={styles.chip}
              />
            ))}
          </Row>
        </Card>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('settings.undo.title')}</Text>
          <Row style={styles.wrapRow} accessibilityRole="radiogroup" accessibilityLabel={t('settings.undo.title')}>
            {undoOptions.map((option) => (
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
                {t('settings.motion.title')}
              </Text>
              <Text style={[styles.help, { color: theme.colors.textMuted }]}>
                {t('settings.motion.help')}
              </Text>
            </View>
            <Switch
              value={settings.reducedMotion}
              onValueChange={settings.setReducedMotion}
              accessibilityLabel={t('settings.motion.title')}
              // React Native Web renders a 20x40 switch by default, against the
              // 44px target the rest of the app keeps to.
              style={styles.switch}
            />
          </Row>

          {Platform.OS !== 'web' ? (
            <Row style={[styles.switchRow, styles.switchDivider]}>
              <View style={styles.switchLabel}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('settings.haptics.title')}</Text>
                <Text style={[styles.help, { color: theme.colors.textMuted }]}>
                  {t('settings.haptics.help')}
                </Text>
              </View>
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={settings.setHapticsEnabled}
                accessibilityLabel={t('settings.haptics.title')}
                style={styles.switch}
              />
            </Row>
          ) : null}
        </Card>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('settings.data.title')}</Text>
          <Text style={[styles.help, { color: theme.colors.textMuted }]}>
            {t('settings.data.help')}
          </Text>
          {confirmingReset ? (
            <Text style={[styles.warning, { color: theme.colors.text }]}>
              {t('settings.data.reset.warning')}
            </Text>
          ) : null}
          <Button
            label={confirmingReset ? t('settings.data.reset.confirm') : t('settings.data.reset')}
            onPress={resetAll}
            theme={theme}
            variant="secondary"
            style={styles.resetButton}
            accessibilityHint={
              confirmingReset ? t('settings.data.reset.hint') : undefined
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
