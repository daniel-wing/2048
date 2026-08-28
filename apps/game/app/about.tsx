/**
 * About — attribution, the ad-free promise, and the privacy statement.
 *
 * The attribution to Gabriele Cirulli is deliberate and non-negotiable: the
 * original 2048 is MIT-licensed and crediting it is both correct and cheap.
 * Note it credits the original without implying its author endorses this app.
 */

import { Link } from 'expo-router';
import Head from 'expo-router/head';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageScroll } from '../src/components/PageScroll';
import { useDocumentTitle } from '../src/i18n/useDocumentTitle';
import { useT } from '../src/i18n/useT';
import { Card, Row } from '../src/components/ui';
import { useTheme } from '../src/theme/useTheme';

const ORIGINAL_REPO = 'https://github.com/gabrielecirulli/2048';

export default function AboutScreen() {
  const theme = useTheme();
  const t = useT();
  useDocumentTitle(t('meta.about.title'));
  const insets = useSafeAreaInsets();

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
        <title>{t('meta.about.title')}</title>
        <meta name="description" content={t('about.privacy.body')} />
      </Head>

      <View style={styles.inner}>
        <Row style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('about.title')}</Text>
          <Link href="/" style={[styles.link, { color: theme.colors.accent }]}>
            {t('nav.done')}
          </Link>
        </Row>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('about.free.title')}
          </Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            {t('about.free.body')}
          </Text>
        </Card>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('about.privacy.title')}
          </Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            {t('about.privacy.body')}
          </Text>
        </Card>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('about.credit.title')}</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            {t('about.credit.body')}
          </Text>
          {/*
            A real anchor, not a Pressable with a link role. The old version
            rendered a div with no href — no cmd-click, no "open in new tab", no
            "copy link address" — and went through window.open, which is
            popup-blockable. ui.tsx documents this exact anti-pattern.
          */}
          <Link
            href={ORIGINAL_REPO}
            target="_blank"
            rel="noopener noreferrer"
            style={[styles.inlineLink, { color: theme.colors.accent }]}
          >
            {t('about.credit.link')}
          </Link>
        </Card>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('about.licence.title')}</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            {t('about.licence.body')}
          </Text>
        </Card>

        <Text style={[styles.version, { color: theme.colors.textMuted }]}>{t('about.version', { version: '0.1.0' })}</Text>
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
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
  },
  inlineLink: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  version: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
