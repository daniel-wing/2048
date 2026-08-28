/**
 * How to play — an animated walkthrough.
 *
 * Every lesson is a real position played by the real engine, not a canned
 * animation: each step declares a starting grid and a list of moves, and the
 * screen applies them through `move()` and renders them with the same `Board`
 * the game uses. So the tutorial cannot drift out of sync with the rules, and
 * anything it shows is by definition something the game actually does.
 *
 * Most steps suppress the tile spawn, so a random tile cannot land mid-lesson
 * and distract from the one rule being demonstrated. The step that teaches
 * spawning turns it back on.
 */

import { gameFromGrid, move, type Direction, type GameState } from '@2048/engine';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Board } from '../src/components/Board';
import { PageScroll } from '../src/components/PageScroll';
import { Button, Row, navChipStyle } from '../src/components/ui';
import { useDocumentTitle } from '../src/i18n/useDocumentTitle';
import { useT } from '../src/i18n/useT';
import { useViewportSize } from '../src/hooks/useViewportSize';
import type { VanishingTile } from '../src/stores/gameStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useTheme } from '../src/theme/useTheme';

type Step = {
  /** Index into the howto.N.* string keys. */
  n: 1 | 2 | 3 | 4 | 5 | 6;
  grid: number[][];
  moves: Direction[];
  /** Whether a new tile drops in after each move. Off unless it is the point. */
  spawn?: boolean;
};

const STEPS: Step[] = [
  {
    n: 1,
    grid: [
      [0, 0, 2, 0],
      [0, 4, 0, 0],
      [0, 0, 0, 8],
      [2, 0, 0, 0],
    ],
    moves: ['left'],
  },
  {
    n: 2,
    grid: [
      [2, 0, 0, 2],
      [0, 0, 0, 0],
      [8, 0, 0, 8],
      [0, 0, 0, 0],
    ],
    moves: ['left'],
  },
  {
    n: 3,
    grid: [
      [4, 4, 4, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    moves: ['left'],
  },
  {
    n: 4,
    grid: [
      [2, 0, 0, 2],
      [0, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 8, 0],
    ],
    moves: ['left', 'down'],
    spawn: true,
  },
  {
    n: 5,
    grid: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [16, 8, 0, 0],
      [64, 32, 4, 2],
    ],
    moves: ['left'],
  },
  {
    n: 6,
    grid: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1024, 1024, 8, 4],
    ],
    moves: ['left'],
  },
];

/** How long each position is held before the next move plays. */
const BEAT_MS = 1100;
/** Extra pause on the final position before the lesson replays. */
const LOOP_PAUSE_MS = 1400;

/** Stable, so the pan gesture is not rebuilt on every beat. */
const NO_OP = () => {};

type DemoState = {
  game: GameState;
  mergedIds: Set<number>;
  spawnedId: number | null;
  vanishing: VanishingTile[];
};

function initial(step: Step): DemoState {
  return {
    game: gameFromGrid(step.grid, { seed: 7 }),
    mergedIds: new Set(),
    spawnedId: null,
    vanishing: [],
  };
}

export default function HowToPlayScreen() {
  const theme = useTheme();
  const t = useT();
  useDocumentTitle(t('meta.howto.title'));
  const insets = useSafeAreaInsets();
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  /**
   * The lesson loops indefinitely, which WCAG 2.2.2 requires a way to stop:
   * auto-updating content lasting more than five seconds needs a pause control.
   *
   * Reduced motion starts it paused rather than merely slowing it. Turning off
   * tile animation was not enough — the board still mutated every 1.1s and the
   * lesson restarted every few seconds, which is exactly the movement the
   * setting is asking us not to make.
   */
  const [paused, setPaused] = useState(reducedMotion);

  const [demo, setDemo] = useState<DemoState>(() => initial(STEPS[0]));

  // The timer chain reads the position it just produced, which a state variable
  // cannot provide synchronously.
  const liveGame = useRef<GameState>(demo.game);

  const boardSize = useMemo(() => {
    if (!viewportWidth || !viewportHeight) return 280;
    return Math.max(220, Math.min(320, viewportWidth - 64, viewportHeight - 560));
  }, [viewportWidth, viewportHeight]);

  const play = useCallback(
    (dir: Direction) => {
      const result = move(liveGame.current, dir, { spawn: step.spawn === true });
      if (!result.moved) return;

      liveGame.current = result.state;
      setDemo({
        game: result.state,
        mergedIds: new Set(result.merges.map((m) => m.survivorId)),
        spawnedId: result.spawned ? result.spawned.id : null,
        // Consumed tiles keep rendering at their destination so they can be seen
        // sliding into the survivor, exactly as the game does.
        vanishing: result.merges.map((m) => ({
          id: m.consumedId,
          value: m.value / 2,
          row: m.row,
          col: m.col,
        })),
      });
    },
    [step],
  );

  // Run the current lesson on a loop until the step changes or the screen goes.
  useEffect(() => {
    const reset = () => {
      const start = initial(step);
      liveGame.current = start.game;
      setDemo(start);
    };

    // Always show the starting position, even while paused, so the step is not
    // blank — the reader can still see the board the lesson talks about.
    reset();
    if (paused) return undefined;

    /*
      Chained rather than all scheduled up front, so exactly one timer is ever
      outstanding and a single handle is enough to cancel cleanly. Scheduling
      them together needed an array that grew by a few entries every couple of
      seconds for as long as the screen stayed open.
    */
    let timer: ReturnType<typeof setTimeout>;

    const runFrom = (index: number) => {
      if (index >= step.moves.length) {
        // Lesson finished: hold the final position, then start it over.
        timer = setTimeout(() => {
          reset();
          timer = setTimeout(() => runFrom(0), BEAT_MS);
        }, LOOP_PAUSE_MS);
        return;
      }

      timer = setTimeout(() => {
        play(step.moves[index]);
        runFrom(index + 1);
      }, BEAT_MS);
    };

    runFrom(0);
    return () => clearTimeout(timer);
  }, [step, play, paused]);

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <PageScroll
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <Head>
        <title>{t('meta.howto.title')}</title>
        <meta
          name="description"
          content={t('howto.title')}
        />
      </Head>

      <View style={styles.inner}>
        <Row style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('howto.title')}</Text>
          <Link href="/" style={navChipStyle(theme)}>
            {t('nav.done')}
          </Link>
        </Row>

        <View style={styles.boardWrap}>
          <Board
            board={demo.game.board}
            size={demo.game.size}
            boardSize={boardSize}
            theme={theme}
            onMove={NO_OP}
            mergedIds={demo.mergedIds}
            spawnedId={demo.spawnedId}
            vanishing={demo.vanishing}
            reducedMotion={reducedMotion}
            // The demo drives itself; swiping it would fight the script.
            interactive={false}
          />
        </View>

        <View
          style={styles.lesson}
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${t('howto.step', { current: stepIndex + 1, total: STEPS.length })}. ${t(`howto.${step.n}.title` as 'howto.1.title')}. ${t(`howto.${step.n}.body` as 'howto.1.body')}`}
        >
          <Text style={[styles.stepCount, { color: theme.colors.textMuted }]}>
            {t('howto.step', { current: stepIndex + 1, total: STEPS.length })}
          </Text>
          <Text style={[styles.stepTitle, { color: theme.colors.text }]}>{t(`howto.${step.n}.title` as 'howto.1.title')}</Text>
          <Text style={[styles.stepBody, { color: theme.colors.textMuted }]}>{t(`howto.${step.n}.body` as 'howto.1.body')}</Text>
        </View>

        <Row style={styles.controls}>
          <Button
            label={paused ? t('howto.resume') : t('howto.pause')}
            onPress={() => setPaused((p) => !p)}
            theme={theme}
            variant="secondary"
            accessibilityHint={paused ? t('howto.resume.hint') : t('howto.pause.hint')}
          />
          <Button
            label={t('nav.back')}
            onPress={() => setStepIndex((i) => Math.max(0, i - 1))}
            theme={theme}
            variant="secondary"
            disabled={isFirst}
          />
          {isLast ? (
            <Link href="/" style={navChipStyle(theme)}>
              {t('nav.play')}
            </Link>
          ) : (
            <Button label={t('nav.next')} onPress={() => setStepIndex((i) => i + 1)} theme={theme} />
          )}
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
    maxWidth: 430,
    gap: 14,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  boardWrap: {
    alignSelf: 'center',
    position: 'relative',
  },
  lesson: {
    gap: 4,
  },
  stepCount: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  stepTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  stepBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  controls: {
    justifyContent: 'space-between',
  },
});
