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
import { Card, Row } from '../src/components/ui';
import { useTheme } from '../src/theme/useTheme';

const ORIGINAL_REPO = 'https://github.com/gabrielecirulli/2048';

export default function AboutScreen() {
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
      {/* Route titles live here now that the layout uses Slot. */}
      <Head>
        <title>About · 2048</title>
        <meta name="description" content="Why this 2048 is free, ad-free, and sends no data anywhere." />
      </Head>

      <View style={styles.inner}>
        <Row style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>About</Text>
          <Link href="/" style={[styles.link, { color: theme.colors.accent }]}>
            Done
          </Link>
        </Row>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Free, and free of ads
          </Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            I built this version because I love 2048 and I hate ads. There are no
            banners, no interstitials, no “watch a video to continue”, and no
            paid upgrade. There never will be.
          </Text>
        </Card>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            No tracking, no network
          </Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            This app sends no data anywhere. It contacts no server other than the
            one it was loaded from, and makes no third-party requests at all — no
            analytics, no telemetry, no tracking SDKs, no accounts. Your scores,
            settings and statistics are stored on this device and never leave it.
          </Text>
        </Card>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Credit</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            Inspired by the original 2048 by Gabriele Cirulli, released under the
            MIT licence. This is an independent, freshly written version and is
            not affiliated with or endorsed by the original author.
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
            View the original project
          </Link>
        </Card>

        <Card theme={theme}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Licence</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            This app is MIT licensed. The original 2048 is © 2014 Gabriele
            Cirulli, also MIT licensed.
          </Text>
        </Card>

        <Text style={[styles.version, { color: theme.colors.textMuted }]}>Version 0.1.0</Text>
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
