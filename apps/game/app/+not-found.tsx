/**
 * Unmatched route.
 *
 * Without this, a stale bookmark or a mistyped path under /ships/2048/ fell
 * through to Expo Router's built-in screen — unstyled, off-brand, and stranded
 * inside the site's own header and footer.
 */

import { Link } from 'expo-router';
import Head from 'expo-router/head';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageScroll } from '../src/components/PageScroll';
import { Row, navChipStyle } from '../src/components/ui';
import { useTheme } from '../src/theme/useTheme';

export default function NotFoundScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <PageScroll
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <Head>
        <title>Not found · 2048</title>
        {/* A 404 has no business in a search index. */}
        <meta name="robots" content="noindex" />
      </Head>

      <View style={styles.inner}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Nothing here</Text>
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          That page does not exist. The game itself is fine — this is just a link that
          points somewhere that never was, or somewhere that has moved.
        </Text>

        <Row style={styles.actions}>
          <Link href="/" style={navChipStyle(theme)}>
            Back to the game
          </Link>
          <Link href="/how-to-play" style={navChipStyle(theme)}>
            How to play
          </Link>
        </Row>
      </View>
    </PageScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  inner: {
    width: '100%',
    maxWidth: 430,
    gap: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    gap: 10,
    flexWrap: 'wrap',
  },
});
