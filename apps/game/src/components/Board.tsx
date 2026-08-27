/**
 * The board: a static grid of empty cells with animated tiles layered on top.
 *
 * The swipe gesture is attached here, and `touchAction: 'none'` is set on the
 * container — without it mobile browsers consume vertical swipes for
 * pull-to-refresh and horizontal ones for back-navigation, which makes the game
 * unplayable on a phone browser.
 */

import { forEachTile, type Direction } from '@2048/engine';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { useSwipe } from '../hooks/useSwipe';
import type { VanishingTile } from '../stores/gameStore';
import { boardGestureStyle } from '../platform/boardGesture';
import { RADIUS_PANEL, type Theme } from '../theme/palettes';
import { Tile } from './Tile';
import type { Board as BoardModel } from '@2048/engine';

export type BoardProps = {
  board: BoardModel;
  size: number;
  /** Outer pixel size of the square board. */
  boardSize: number;
  theme: Theme;
  onMove: (dir: Direction) => void;
  mergedIds: Set<number>;
  spawnedId: number | null;
  vanishing: VanishingTile[];
  reducedMotion?: boolean;
  interactive?: boolean;
};

export function Board({
  board,
  size,
  boardSize,
  theme,
  onMove,
  mergedIds,
  spawnedId,
  vanishing,
  reducedMotion = false,
  interactive = true,
}: BoardProps) {
  const gesture = useSwipe(onMove, interactive);

  // Gap and cell size derive from the board's pixel size so the same layout
  // works from a 3x3 on a phone to an 8x8 on a desktop.
  const gap = Math.max(4, Math.round(boardSize * (size <= 4 ? 0.028 : 0.018)));
  const cellSize = Math.floor((boardSize - gap * (size + 1)) / size);

  /**
   * The cell layer doubles as the accessible grid.
   *
   * The animated tiles cannot carry this: they are absolutely positioned and
   * keyed by creation id, so their DOM order is arbitrary relative to the
   * board. A screen reader walking them heard a shuffled list of numbers with
   * no coordinates and no mention of the empty squares — the position was
   * genuinely unreconstructable. These cells are emitted row by row, name where
   * they are, and say when they are empty.
   */
  const cells = useMemo(() => {
    const out: Array<{ key: string; row: number; col: number; label: string }> = [];
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const cell = board[row]?.[col];
        // One-based, because these are read aloud to a person.
        const where = `row ${row + 1}, column ${col + 1}`;
        out.push({
          key: `${row}-${col}`,
          row,
          col,
          label: cell ? `${where}, ${cell.value}` : `${where}, empty`,
        });
      }
    }
    return out;
  }, [size, board]);

  const tiles = useMemo(() => {
    const out: Array<{ id: number; value: number; row: number; col: number }> = [];
    forEachTile(board, (tile, coord) => {
      out.push({ id: tile.id, value: tile.value, row: coord.row, col: coord.col });
    });
    // Stable order by id keeps React from re-creating elements on every move.
    return out.sort((a, b) => a.id - b.id);
  }, [board]);

  return (
    <GestureDetector gesture={gesture}>
      <View
        // `role`/`aria-*` rather than accessibilityRole: React Native's role
        // list has no "grid", but the ARIA props pass straight through on web
        // and are the ones that make the board navigable.
        role="grid"
        aria-label={`${size} by ${size} game board`}
        style={[
          styles.board,
          {
            width: boardSize,
            height: boardSize,
            backgroundColor: theme.colors.boardBackground,
            // Matches the site's panel radius so the board reads as one of its cards.
            borderRadius: RADIUS_PANEL,
          },
          // Web-only style props live behind a platform split; `touchAction`
          // has no native equivalent and only typechecks here because React
          // Native Web augments the style types, so nothing would catch it.
          boardGestureStyle,
        ]}
      >
        {cells.map(({ key, row, col, label }) => (
          <View
            key={key}
            // React Native's Role union offers "cell" rather than ARIA's
            // "gridcell"; React Native Web emits it as a gridcell inside a grid.
            role="cell"
            aria-label={label}
            style={[
              {
                position: 'absolute',
                left: gap + col * (cellSize + gap),
                top: gap + row * (cellSize + gap),
                width: cellSize,
                height: cellSize,
                borderRadius: Math.max(4, cellSize * 0.08),
                backgroundColor: theme.colors.cellBackground,
              },
            ]}
          />
        ))}

        {/*
          Everything below is the visual layer, hidden from assistive tech.

          The cells above already carry every value and coordinate, so exposing
          the tiles as well would read each number twice — and in creation
          order, which bears no relation to where they are on the board.

          absoluteFill rather than a plain wrapper, so the tiles keep resolving
          their absolute positions against a box that exactly covers the board.
        */}
        <View style={StyleSheet.absoluteFill} aria-hidden pointerEvents="none">
        {/* Consumed tiles render first so survivors sit above them. */}
        {vanishing.map((tile) => (
          <Tile
            key={`vanish-${tile.id}`}
            value={tile.value}
            row={tile.row}
            col={tile.col}
            cellSize={cellSize}
            gap={gap}
            theme={theme}
            isVanishing
            reducedMotion={reducedMotion}
          />
        ))}

        {tiles.map((tile) => (
          <Tile
            key={tile.id}
            value={tile.value}
            row={tile.row}
            col={tile.col}
            cellSize={cellSize}
            gap={gap}
            theme={theme}
            isNew={tile.id === spawnedId}
            isMerged={mergedIds.has(tile.id)}
            reducedMotion={reducedMotion}
          />
        ))}
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    overflow: 'hidden',
  },
});
