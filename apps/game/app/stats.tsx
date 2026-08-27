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
import { useStatsStore } from '../src/stores/statsStore';
import { useTheme } from '../src/theme/useTheme';

export default function StatsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const stats = useStatsStore((s) => s.stats);

  const unlocked = achievements(stats);
  const unlockedCount = unlocked.filter((a) => a.achieved).length;

  const rows: Array<[string, string]> = [
    ['Best score', stats.bestScore.toLocaleString()],
    ['Highest tile', stats.highestTile ? String(stats.highestTile) : '—'],
    ['Games played', String(stats.gamesStarted)],
    ['Games won', String(stats.gamesWon)],
    ['Longest win streak', String(stats.longestWinStreak)],
    ['Total moves', stats.totalMoves.toLocaleString()],
    ['Total merges', stats.totalMerges.toLocaleString()],
    ['Lifetime score', stats.totalScore.toLocaleString()],
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
        <title>Stats · 2048</title>
        <meta name="description" content="Your lifetime 2048 statistics and achievements." />
      </Head>

      <View style={styles.inner}>
        <Row style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Stats</Text>
          <Link href="/" style={[styles.link, { color: theme.colors.accent }]}>
            Done
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
            Achievements ({unlockedCount}/{unlocked.length})
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
                  accessibilityLabel={achievement.achieved ? 'Unlocked' : 'Locked'}
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
                    {achievement.label}
                  </Text>
                  <Text style={[styles.help, { color: theme.colors.textMuted }]}>
                    {achievement.description}
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
