/**
 * Lifetime stats and achievements.
 */

import { achievements } from '@2048/engine';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageScroll } from '../src/components/PageScroll';
import { Card, Row } from '../src/components/ui';
import { describeAchievement } from '../src/i18n/achievements';
import { useDocumentTitle } from '../src/i18n/useDocumentTitle';
import { useT } from '../src/i18n/useT';
import { useStatsStore } from '../src/stores/statsStore';
import { useTheme } from '../src/theme/useTheme';

export default function StatsScreen() {
  const theme = useTheme();
  const t = useT();
  useDocumentTitle(t('meta.stats.title'));
  const insets = useSafeAreaInsets();
  const stats = useStatsStore((s) => s.stats);

  const unlocked = achievements(stats);
  const unlockedCount = unlocked.filter((a) => a.achieved).length;

  const rows: Array<[string, string]> = [
    [t('stats.bestScore'), stats.bestScore.toLocaleString()],
    [t('stats.highestTile'), stats.highestTile ? String(stats.highestTile) : '—'],
    [t('stats.gamesPlayed'), String(stats.gamesStarted)],
    [t('stats.gamesWon'), String(stats.gamesWon)],
    [t('stats.longestStreak'), String(stats.longestWinStreak)],
    [t('stats.totalMoves'), stats.totalMoves.toLocaleString()],
    [t('stats.totalMerges'), stats.totalMerges.toLocaleString()],
    [t('stats.lifetimeScore'), stats.totalScore.toLocaleString()],
  ];

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
        <title>{t('meta.stats.title')}</title>
        <meta name="description" content={t('meta.stats.title')} />
      </Head>

      <View style={styles.inner}>
        <Row style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('stats.title')}</Text>
          <Link href="/" style={[styles.link, { color: theme.colors.accent }]}>
            {t('nav.done')}
          </Link>
        </Row>

        <Card theme={theme}>
          {rows.map(([label, value], index) => (
            <Row
              key={label}
              style={[
                styles.statRow,
                index > 0 ? { borderTopWidth: 1, borderTopColor: theme.colors.border } : null,
              ]}
            >
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{label}</Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
            </Row>
          ))}
        </Card>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('stats.achievements', { unlocked: unlockedCount, total: unlocked.length })}
          </Text>
          <View style={styles.achievementList}>
            {unlocked.map((achievement) => (
              <Row key={achievement.id} style={styles.achievement}>
                <Text
                  style={[
                    styles.badge,
                    {
                      color: achievement.achieved ? theme.colors.accent : theme.colors.textMuted,
                    },
                  ]}
                  // The glyph reads as "black star"/"white star", which says
                  // nothing about the achievement. Label it and hide the shape.
                  accessibilityLabel={achievement.achieved ? t('stats.unlocked') : t('stats.locked')}
                >
                  {achievement.achieved ? '★' : '☆'}
                </Text>
                <View style={styles.achievementText}>
                  <Text
                    style={[
                      styles.achievementLabel,
                      {
                        color: achievement.achieved ? theme.colors.text : theme.colors.textMuted,
                      },
                    ]}
                  >
                    {describeAchievement(achievement, t).label}
                  </Text>
                  <Text style={[styles.help, { color: theme.colors.textMuted }]}>
                    {describeAchievement(achievement, t).description}
                  </Text>
                </View>
              </Row>
            ))}
          </View>
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
    marginBottom: 8,
  },
  statRow: {
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  achievementList: {
    gap: 12,
  },
  achievement: {
    alignItems: 'flex-start',
    gap: 10,
  },
  badge: {
    fontSize: 18,
    lineHeight: 22,
  },
  achievementText: {
    flex: 1,
  },
  achievementLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  help: {
    fontSize: 13,
    marginTop: 1,
  },
});
