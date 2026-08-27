/**
 * One animated tile.
 *
 * Tiles are absolutely positioned and keyed by their stable engine id, so when
 * a tile's row/col changes React updates the same element and Reanimated
 * animates it to the new spot. That is what makes a move read as tiles sliding
 * rather than the board redrawing.
 *
 * All animation goes through Reanimated (never CSS transitions) so the exact
 * same code drives iOS and Android in Phase 2.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { FONT_STACK, tileFontScale, tileStyle, type Theme } from '../theme/palettes';

export const SLIDE_MS = 110;
const POP_MS = 90;

export type TileProps = {
  value: number;
  row: number;
  col: number;
  cellSize: number;
  gap: number;
  theme: Theme;
  /** Freshly spawned this move — scales in instead of sliding. */
  isNew?: boolean;
  /** Survivor of a merge this move — pops. */
  isMerged?: boolean;
  /** Consumed by a merge — slides to its destination, then unmounts. */
  isVanishing?: boolean;
  reducedMotion?: boolean;
};

function offsetFor(index: number, cellSize: number, gap: number): number {
  return gap + index * (cellSize + gap);
}

function TileComponent({
  value,
  row,
  col,
  cellSize,
  gap,
  theme,
  isNew = false,
  isMerged = false,
  isVanishing = false,
  reducedMotion = false,
}: TileProps) {
  const targetX = offsetFor(col, cellSize, gap);
  const targetY = offsetFor(row, cellSize, gap);

  const translateX = useSharedValue(targetX);
  const translateY = useSharedValue(targetY);
  // A new tile grows in; an existing tile is already at full size.
  const scale = useSharedValue(isNew ? 0 : 1);

  // Only a change of *grid square* is a move worth animating. When the board
  // itself resizes (window resize, safe-area settling, orientation change) the
  // pixel target changes while row/col stay put — snapping there avoids tiles
  // gliding across the screen just because the layout reflowed.
  const lastCell = useRef({ row, col });

  useEffect(() => {
    const movedCell = lastCell.current.row !== row || lastCell.current.col !== col;
    lastCell.current = { row, col };

    if (reducedMotion || !movedCell) {
      translateX.value = targetX;
      translateY.value = targetY;
      return;
    }

    const config = { duration: SLIDE_MS, easing: Easing.out(Easing.quad) };
    translateX.value = withTiming(targetX, config);
    translateY.value = withTiming(targetY, config);
  }, [row, col, targetX, targetY, reducedMotion, translateX, translateY]);

  // Spawn and merge emphasis.
  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      return;
    }
    if (isNew) {
      scale.value = withTiming(1, { duration: POP_MS, easing: Easing.out(Easing.back(1.6)) });
    } else if (isMerged) {
      scale.value = withSequence(
        withTiming(1.16, { duration: POP_MS / 2 }),
        withTiming(1, { duration: POP_MS / 2 }),
      );
    }
  }, [isNew, isMerged, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const palette = tileStyle(theme, value);
  const fontSize = Math.round(cellSize * tileFontScale(value) * 0.62);

  return (
    <Animated.View
      // `accessibilityElementsHidden` is iOS-only and dropped by React Native
      // Web, so merged-away tiles stayed in the accessibility tree for the
      // length of the animation as ghost duplicates. `aria-hidden` is honoured
      // on both.
      aria-hidden={isVanishing}
      importantForAccessibility={isVanishing ? 'no-hide-descendants' : 'auto'}
      style={[
        styles.tile,
        {
          // Tiles must never intercept the swipe gesture on the board beneath.
          pointerEvents: 'none',
          width: cellSize,
          height: cellSize,
          backgroundColor: palette.bg,
          borderRadius: Math.max(4, cellSize * 0.08),
          // Consumed tiles sit under their survivor so the pop reads clearly.
          zIndex: isVanishing ? 1 : 2,
        },
        animatedStyle,
      ]}
    >
      <Text
        allowFontScaling={false}
        style={[styles.label, { color: palette.fg, fontSize }]}
        accessibilityLabel={`Tile ${value}`}
      >
        {value}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: FONT_STACK,
    fontWeight: '800',
    // Avoids sub-pixel text jitter while the tile is mid-slide.
    includeFontPadding: false,
    textAlign: 'center',
  },
});

export const Tile = React.memo(TileComponent);
