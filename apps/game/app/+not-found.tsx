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
import { useDocumentTitle } from '../src/i18n/useDocumentTitle';
import { useT } from '../src/i18n/useT';
import { Row, navChipStyle } from '../src/components/ui';
import { useTheme } from '../src/theme/useTheme';

export default function NotFoundScreen() {
  const theme = useTheme();
  const t = useT();
  useDocumentTitle(t('meta.notFound.title'));
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
        <title>{t('meta.notFound.title')}</title>
        {/* A 404 has no business in a search index. */}
        <meta name="robots" content="noindex" />
      </Head>

      <View style={styles.inner}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('notFound.title')}</Text>
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          {t('notFound.body')}
        </Text>

        <Row style={styles.actions}>
          <Link href="/" style={navChipStyle(theme)}>
            {t('notFound.back')}
          </Link>
          <Link href="/how-to-play" style={navChipStyle(theme)}>
            {t('game.howToPlay')}
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
