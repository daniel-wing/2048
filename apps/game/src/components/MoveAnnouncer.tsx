/**
 * Spoken feedback for what a move just did.
 *
 * A sighted player reads the result off the board. A screen-reader user gets
 * nothing unless we say it, and the naive version — announce the score — is
 * silent in exactly the two cases that need it most:
 *
 *   1. A move that shifts tiles without merging leaves the score unchanged.
 *      Assistive tech does not re-announce identical live-region text, so the
 *      player hears nothing at all.
 *   2. An illegal move changes no state whatsoever, so there is nothing to key
 *      an announcement off. This is the one outcome that cannot be inferred
 *      from the board, and silence reads as "did my input even register?".
 *
 * So this announces the OUTCOME, keyed on a counter that the store bumps for
 * every attempt including rejected ones.
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useT, type Translate } from '../i18n/useT';
import type { MoveOutcome } from '../stores/gameStore';

/**
 * Minimum gap between announcements.
 *
 * Holding an arrow key produces a move every ~30ms. Speaking each one buries
 * the player; speaking the most recent state of a burst is what they want.
 */
const THROTTLE_MS = 700;

export function describeOutcome(outcome: MoveOutcome, t: Translate): string {
  // Directions are translated as words, not codes: "hacia la izquierda" needs
  // the article, which is why the dictionary carries the whole phrase.
  const direction = t(`dir.${outcome.dir}` as 'dir.up');

  if (!outcome.moved) return t('a11y.noMove', { direction });

  const parts = [t('a11y.moved', { direction })];

  if (outcome.merged.length > 0) {
    const values =
      outcome.merged.length === 1
        ? String(outcome.merged[0])
        : outcome.merged.slice(0, -1).join(', ') +
          ` ${t('a11y.and')} ` +
          outcome.merged[outcome.merged.length - 1];
    parts.push(t('a11y.merged', { values }));
    parts.push(t('a11y.scoreNow', { score: outcome.score }));
  }

  if (outcome.spawned) {
    // The most useful half: the board changed underneath them, and this is the
    // only part they could not have predicted.
    parts.push(
      t('a11y.spawned', {
        value: outcome.spawned.value,
        row: outcome.spawned.row + 1,
        col: outcome.spawned.col + 1,
      }),
    );
  }

  return parts.join(' ');
}

export function MoveAnnouncer({ outcome }: { outcome: MoveOutcome | null }) {
  const t = useT();
  const [message, setMessage] = useState('');
  const lastSpokenAt = useRef(0);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!outcome) return undefined;

    const speak = () => {
      lastSpokenAt.current = Date.now();
      /*
        Two consecutive identical outcomes — "No move left." twice — produce
        identical text, which assistive tech treats as nothing having changed
        and stays silent. Alternating an invisible zero-width space makes the
        DOM text differ while what is spoken does not.
      */
      const marker = outcome.seq % 2 === 0 ? '​' : '';
      setMessage(describeOutcome(outcome, t) + marker);
    };

    const since = Date.now() - lastSpokenAt.current;
    if (since >= THROTTLE_MS) {
      speak();
      return undefined;
    }

    // Mid-burst: hold this one and speak the latest when the window opens.
    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(speak, THROTTLE_MS - since);
    return () => {
      if (pending.current) clearTimeout(pending.current);
    };
  }, [outcome, t]);

  return (
    <View
      // Visually hidden, but present in the accessibility tree. `display: none`
      // or zero size would remove it from that tree along with the announcement.
      style={styles.visuallyHidden}
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
    >
      <Text>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    // Off-screen rather than sized to nothing, so it keeps being announced.
    left: -9999,
    top: 0,
  },
});
