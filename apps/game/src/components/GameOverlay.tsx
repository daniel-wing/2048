/**
 * Win / game-over overlay drawn across the board.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Theme } from '../theme/palettes';
import { Button, Row } from './ui';

export type GameOverlayProps = {
  kind: 'won' | 'over';
  /** The tile that counts as a win — the engine supports changing it. */
  winTarget?: number;
  score: number;
  theme: Theme;
  onNewGame: () => void;
  onKeepPlaying?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
};

export function GameOverlay({
  kind,
  winTarget = 2048,
  score,
  theme,
  onNewGame,
  onKeepPlaying,
  onUndo,
  canUndo = false,
}: GameOverlayProps) {
  const won = kind === 'won';

  return (
    <View
      style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {won ? 'You win!' : 'Game over'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
        {won ? `You reached ${winTarget} with ${score} points.` : `Final score: ${score}`}
      </Text>

      <Row style={styles.actions}>
        {won && onKeepPlaying ? (
          <Button label="Keep going" onPress={onKeepPlaying} theme={theme} />
        ) : null}
        {!won && canUndo && onUndo ? (
          <Button label="Undo" onPress={onUndo} theme={theme} variant="secondary" />
        ) : null}
        <Button
          label="New game"
          onPress={onNewGame}
          theme={theme}
          variant={won ? 'secondary' : 'primary'}
        />
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  actions: {
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
