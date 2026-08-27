/**
 * The game screen.
 */

import type { Direction } from '@2048/engine';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageScroll } from '../src/components/PageScroll';
import { Board } from '../src/components/Board';
import { GameOverlay } from '../src/components/GameOverlay';
import { Button, IconButton, Row, ScorePill, navChipStyle } from '../src/components/ui';
import { useKeyboard } from '../src/hooks/useKeyboard';
import { useViewportSize } from '../src/hooks/useViewportSize';
import { MoveAnnouncer } from '../src/components/MoveAnnouncer';
import { selectBest, useGameStore } from '../src/stores/gameStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useTheme } from '../src/theme/useTheme';

/**
 * How large the board is allowed to get on a roomy screen, and the floor below
 * which it stops shrinking. 460 used to be a fixed cap regardless of screen,
 * which left the game as a narrow column stranded in the middle of a desktop
 * window.
 *
 * On a short window the floor wins and the page scrolls a little. That is the
 * right trade: the board and the hint still sit above the fold, and only the
 * site footer needs a nudge to reach — the same as every other page on the site.
 */
const MAX_BOARD = 600;
const MIN_BOARD = 300;

export default function GameScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const game = useGameStore((s) => s.game);
  const merges = useGameStore((s) => s.merges);
  const spawnedId = useGameStore((s) => s.spawnedId);
  const vanishing = useGameStore((s) => s.vanishing);
  const historyLength = useGameStore((s) => s.history.length);
  const best = useGameStore(selectBest);
  const lastOutcome = useGameStore((st) => st.lastOutcome);

  const move = useGameStore((s) => s.move);
  const newGame = useGameStore((s) => s.newGame);
  const undo = useGameStore((s) => s.undo);
  const continuePlaying = useGameStore((s) => s.continuePlaying);

  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const undoDepth = useSettingsStore((s) => s.undoDepth);

  const canUndo = undoDepth !== 0 && historyLength > 0;

  const handleMove = useCallback((dir: Direction) => move(dir), [move]);
  const handleUndo = useCallback(() => undo(), [undo]);

  /**
   * New game is destructive and cannot be undone — `newGame` clears the
   * history. When there is something to lose, the button asks first and names
   * the score, the same two-press pattern the watch screen uses. The `r`
   * shortcut routes through here too: a single unmodified key that fires from
   * anywhere on the page must not be able to bin a game outright.
   */
  const [confirmingNewGame, setConfirmingNewGame] = useState(false);
  const hasProgress = game.score > 0 && !game.over;

  const handleNewGame = useCallback(() => {
    if (hasProgress && !confirmingNewGame) {
      setConfirmingNewGame(true);
      return;
    }
    setConfirmingNewGame(false);
    newGame();
  }, [newGame, hasProgress, confirmingNewGame]);

  const showWin = game.won && !game.keepPlaying && !game.over;
  const showOver = game.over;

  /**
   * Keys are gated on the overlays for the same reason the swipe gesture is.
   * Only the gesture was gated before, and `gameStore.move` guards `over` but
   * not `won` — so after reaching 2048 the arrow keys kept playing a board
   * hidden behind the overlay, score climbing, with no way to see it.
   */
  useKeyboard({
    onMove: handleMove,
    onUndo: canUndo ? handleUndo : undefined,
    onNewGame: handleNewGame,
    enabled: !showWin && !showOver,
  });

  const mergedIds = useMemo(() => new Set(merges.map((m) => m.survivorId)), [merges]);

  /**
   * Board sizing.
   *
   * Computed straight from the viewport rather than measured from the DOM.
   * An earlier version derived the width from `onLayout` on the board wrapper,
   * but that fires once with a width of 0 before layout settles and then never
   * again, leaving the board stuck at its fallback size forever.
   *
   * `useViewportSize` is safe to use here where `useWindowDimensions` is not:
   * this page is statically prerendered, and the React Native hook reports the
   * build machine's viewport and never corrects on the client.
   *
   * The same number caps the content column and the board, so the title, scores
   * and controls always line up flush with the board's edges instead of floating
   * in a wider column than the board itself.
   */
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();

  // Everything above and below the board: the site header (~98) and footer
  // (~65), the title block, the controls row, the hint, the links, the gaps
  // between them and the page padding. Measured at 431 in the browser; 440
  // leaves a little headroom so the board does not push the footer off-screen.
  const VERTICAL_CHROME = 440;
  // Horizontal padding on the page container, both sides.
  const HORIZONTAL_PADDING = 32;

  const boardSize = useMemo(() => {
    // Before the first client measurement (the prerendered pass) pick something
    // reasonable; it corrects on mount.
    if (!viewportWidth || !viewportHeight) return 360;

    const byHeight = viewportHeight - VERTICAL_CHROME;
    const byWidth = viewportWidth - HORIZONTAL_PADDING;

    // The floor applies to the HEIGHT budget only. Applying it to width too
    // meant a 320px phone got a 300px board inside a 288px column — twelve
    // pixels of horizontal overflow and a pinch-zoomable page. Available width
    // is a hard limit, never something to round up past.
    const preferred = Math.max(MIN_BOARD, Math.min(MAX_BOARD, byHeight));
    return Math.min(preferred, byWidth);
  }, [viewportWidth, viewportHeight]);

  /**
   * The column matches the board so the title, scores and controls line up
   * flush with its edges — but never drops below the width the two control rows
   * need to stay on one line each. On a short window the board hits its floor,
   * and letting the column shrink with it orphaned "About" onto a line of its
   * own. Below this threshold the board is simply centred in a slightly wider
   * column, which reads far better than a ragged wrap.
   *
   * `width: '100%'` still clamps this to whatever the viewport actually allows,
   * so it can never cause a horizontal overflow on a narrow phone.
   */
  const MIN_COLUMN = 430;
  const columnWidth = Math.max(boardSize, MIN_COLUMN);

  /**
   * Below the column floor the four bottom-row items cannot share a line, and
   * flex-wrap strands "About" on its own. Giving New game its own row instead
   * reads as deliberate — an action, then the navigation under it — rather than
   * a ragged wrap, and a phone has the vertical room to spare.
   */
  const narrow = viewportWidth > 0 && viewportWidth - HORIZONTAL_PADDING < MIN_COLUMN;

  return (
    <PageScroll
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 },
      ]}
    >
      {/* Expo Router owns <head> on web; a <title> in +html.tsx gets cleared. */}
      <Head>
        <title>2048 — Free and Ad-Free</title>
        <meta
          name="description"
          content="A free, ad-free, tracking-free 2048. Works offline. No accounts, no analytics, no third-party requests. Your data never leaves your device."
        />
      </Head>

      {/* Speaks what each move did; invisible, and the only feedback a
          screen-reader user gets that their input registered. */}
      <MoveAnnouncer outcome={lastOutcome} />

      <View style={[styles.inner, { maxWidth: columnWidth }]}>
        {/*
          Title on the left, then the live controls: undo sits with the score
          and best readouts it acts on, all sharing one baseline. Previously the
          pills floated top-right while undo sat a row below, which read as two
          unrelated clusters.
        */}
        <Row style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: theme.colors.text }]}>2048</Text>
            <Text style={[styles.tagline, { color: theme.colors.textMuted }]}>
              Free · No ads · No tracking
            </Text>
          </View>

          <Row style={styles.statusCluster}>
            {/*
              U+21BA, the conventional "undo" circular arrow. An icon rather
              than a word because the meaning is universal.
            */}
            <IconButton
              glyph="↺"
              accessibilityLabel="Undo"
              onPress={handleUndo}
              theme={theme}
              disabled={!canUndo}
              accessibilityHint="Take back your last move"
            />
            <ScorePill label="Score" value={game.score} theme={theme} />
            {/*
              Bests are tracked per board size — a 3x3 best is not comparable to
              an 8x8 one. Naming the size keeps that from looking like a reset
              when the player switches sizes.
            */}
            <ScorePill label={`Best ${game.size}×${game.size}`} value={best} theme={theme} />
          </Row>
        </Row>

        <View style={styles.boardWrap}>
          <Board
            board={game.board}
            size={game.size}
            boardSize={boardSize}
            theme={theme}
            onMove={handleMove}
            mergedIds={mergedIds}
            spawnedId={spawnedId}
            vanishing={vanishing}
            reducedMotion={reducedMotion}
            interactive={!showWin && !showOver}
          />

          {showWin ? (
            <GameOverlay
              kind="won"
              score={game.score}
              winTarget={game.winTarget}
              theme={theme}
              onNewGame={handleNewGame}
              onKeepPlaying={continuePlaying}
            />
          ) : null}

          {showOver ? (
            <GameOverlay
              kind="over"
              score={game.score}
              theme={theme}
              onNewGame={handleNewGame}
              onUndo={handleUndo}
              canUndo={canUndo}
            />
          ) : null}
        </View>

        {/*
          The tutorial hangs off the hint rather than taking a slot in the row
          below: this is the line someone reads when they are wondering how the
          game works, and the bottom row is already at the width it can fit.
          Nested Text keeps it on one line at any size.
        */}
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          Swipe to move — or use the arrow keys.{' '}
          <Link href="/how-to-play" style={[styles.hintLink, { color: theme.colors.text }]}>
            How to play
          </Link>
          {'  ·  '}
          <Link href="/watch" style={[styles.hintLink, { color: theme.colors.text }]}>
            Watch a game
          </Link>
        </Text>

        {/*
          New game lives down here rather than above the board. It discards the
          current game, and sitting directly over the play area it was easy to
          hit by accident while swiping.

          The links are styled Links rather than Pressables wrapped in
          `<Link asChild>`, so each is a real anchor with an href — cmd-click and
          "open in new tab" work.
        */}
        {narrow ? (
          <Row style={styles.footer}>
            <Button
              label={confirmingNewGame ? 'Discard and restart' : 'New game'}
              onPress={handleNewGame}
              theme={theme}
              accessibilityHint={
                confirmingNewGame
                  ? `This discards your game worth ${game.score} points and cannot be undone`
                  : undefined
              }
            />
          </Row>
        ) : null}

        <Row style={styles.footer}>
          {narrow ? null : (
            <Button
              label={confirmingNewGame ? 'Discard and restart' : 'New game'}
              onPress={handleNewGame}
              theme={theme}
              accessibilityHint={
                confirmingNewGame
                  ? `This discards your game worth ${game.score} points and cannot be undone`
                  : undefined
              }
            />
          )}
          <Link href="/settings" style={navChipStyle(theme)}>
            Settings
          </Link>
          <Link href="/stats" style={navChipStyle(theme)}>
            Stats
          </Link>
          <Link href="/about" style={navChipStyle(theme)}>
            About
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
    paddingHorizontal: 16,
  },
  inner: {
    width: '100%',
    gap: 10,
  },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    // On a narrow phone the cluster and the tagline cannot share a line without
    // the tagline breaking mid-phrase. Letting the row wrap drops the cluster
    // onto its own line instead.
    flexWrap: 'wrap',
    rowGap: 10,
  },
  statusCluster: {
    // Undo is 44 tall and the pills a little more; centring keeps their
    // midlines together rather than their edges.
    alignItems: 'center',
  },
  titleBlock: {
    flexShrink: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
  },
  boardWrap: {
    alignSelf: 'center',
    position: 'relative',
    // The square Board inside supplies both dimensions. No aspectRatio here —
    // combined with a max height it makes Yoga produce a wrapper shorter than
    // its own child, and the text below then overlaps the board.
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
  },
  hintLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  footer: {
    justifyContent: 'center',
    gap: 10,
    marginTop: 2,
    // Four items will not fit one line on a phone.
    flexWrap: 'wrap',
    rowGap: 10,
  },
});
