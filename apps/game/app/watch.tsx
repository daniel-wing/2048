/**
 * Watch a game — the computer plays, live.
 *
 * Not a recording. The engine's `bestMove` is called on the real position every
 * tick, so it is a different game every time and the viewer can take the
 * position over mid-game and carry on themselves.
 *
 * The AI is deliberately called at the START of a tick rather than immediately
 * after applying a move: a deep search can take tens of milliseconds, and doing
 * it while tiles are still sliding would stutter the animation. At the top of a
 * tick nothing is moving, so the cost lands in idle time.
 */

import { bestMove, createGame, move, type GameState } from '@2048/engine';
import { Link, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Board } from '../src/components/Board';
import { PageScroll } from '../src/components/PageScroll';
import { Button, Row, ScorePill, navChipStyle } from '../src/components/ui';
import { useDocumentTitle } from '../src/i18n/useDocumentTitle';
import { useT } from '../src/i18n/useT';
import { useViewportSize } from '../src/hooks/useViewportSize';
import type { VanishingTile } from '../src/stores/gameStore';
import { useGameStore } from '../src/stores/gameStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useTheme } from '../src/theme/useTheme';

/** Milliseconds between moves, slowest first. */
const SPEEDS = [
  { key: 'watch.speed.slow', ms: 420 },
  { key: 'watch.speed.normal', ms: 200 },
  { key: 'watch.speed.fast', ms: 90 },
] as const;

/** Pause on the final position before starting a new game. */
const RESTART_PAUSE_MS = 2600;

/**
 * Stable identity matters here: `useSwipe` memoises on its callback, so an
 * inline arrow made GestureDetector tear down and rebuild the pan gesture two
 * to eleven times a second while the demo ran.
 */
const NO_OP = () => {};

type Demo = {
  game: GameState;
  mergedIds: Set<number>;
  spawnedId: number | null;
  vanishing: VanishingTile[];
};

function fresh(size: number, seed: number): Demo {
  return {
    game: createGame({ size, seed }),
    mergedIds: new Set(),
    spawnedId: null,
    vanishing: [],
  };
}

export default function WatchScreen() {
  const theme = useTheme();
  const t = useT();
  useDocumentTitle(t('meta.watch.title'));
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: viewportWidth, height: viewportHeight } = useViewportSize();
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const adoptGame = useGameStore((s) => s.adoptGame);
  // Taking over replaces whatever the player already had going.
  const playerScore = useGameStore((s) => s.game.score);
  const playerGameOver = useGameStore((s) => s.game.over);

  const [speedIndex, setSpeedIndex] = useState(1);
  const [paused, setPaused] = useState(false);
  /*
    Seeded from the clock at mount, the way gameStore does. The engine stays
    pure and seeded — this is the app layer choosing which seed — but a fixed
    one meant every visitor watched the same game, and the second was always
    the same too, while the file claimed otherwise.
  */
  const [demo, setDemo] = useState<Demo>(() => fresh(4, Date.now() >>> 0));
  const [confirmingTakeOver, setConfirmingTakeOver] = useState(false);

  // The tick reads the position it produced last time, which state cannot give
  // it synchronously.
  const live = useRef<GameState>(demo.game);
  // Varies the seed per game without Math.random, which the engine forbids.
  const gameCount = useRef(0);

  const boardSize = useMemo(() => {
    if (!viewportWidth || !viewportHeight) return 320;
    return Math.max(240, Math.min(420, viewportWidth - 64, viewportHeight - 470));
  }, [viewportWidth, viewportHeight]);

  const restart = useCallback(() => {
    gameCount.current += 1;
    const next = fresh(4, (Date.now() + gameCount.current * 7919) >>> 0);
    live.current = next.game;
    setDemo(next);
  }, []);

  const step = useCallback(() => {
    const current = live.current;
    const dir = bestMove(current.board);

    if (!dir) {
      restart();
      return;
    }

    const result = move(current, dir);
    if (!result.moved) {
      restart();
      return;
    }

    live.current = result.state;
    setDemo({
      game: result.state,
      mergedIds: new Set(result.merges.map((m) => m.survivorId)),
      spawnedId: result.spawned ? result.spawned.id : null,
      vanishing: result.merges.map((m) => ({
        id: m.consumedId,
        value: m.value / 2,
        row: m.row,
        col: m.col,
      })),
    });
  }, [restart]);

  useEffect(() => {
    if (paused) return undefined;

    const interval = SPEEDS[speedIndex].ms;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      // Over: hold the final board a moment, then start a new game.
      if (live.current.over) {
        timer = setTimeout(() => {
          restart();
          timer = setTimeout(tick, interval);
        }, RESTART_PAUSE_MS);
        return;
      }
      step();
      timer = setTimeout(tick, interval);
    };

    timer = setTimeout(tick, interval);
    return () => clearTimeout(timer);
  }, [paused, speedIndex, step, restart]);

  /**
   * Hand the current position to the real game and go play it.
   *
   * This overwrites whatever game the player had going, which is unrecoverable
   * — so when they have one in progress the button asks first. Two presses
   * rather than a dialog: there is no portable confirm in React Native, and a
   * button that states the consequence is clearer than a modal anyway.
   */
  const takeOver = useCallback(() => {
    const wouldDiscard = playerScore > 0 && !playerGameOver;

    if (wouldDiscard && !confirmingTakeOver) {
      setConfirmingTakeOver(true);
      return;
    }

    adoptGame(live.current);
    router.push('/');
  }, [adoptGame, router, playerScore, playerGameOver, confirmingTakeOver]);

  const best = useMemo(() => {
    let max = 0;
    for (const row of demo.game.board) for (const cell of row) if (cell && cell.value > max) max = cell.value;
    return max;
  }, [demo.game.board]);

  return (
    <PageScroll
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <Head>
        <title>{t('meta.watch.title')}</title>
        <meta
          name="description"
          content={t('watch.title')}
        />
      </Head>

      <View style={styles.inner}>
        <Row style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('watch.title')}</Text>
          <Link href="/" style={navChipStyle(theme)}>
            {t('nav.done')}
          </Link>
        </Row>

        <Row style={styles.status}>
          <ScorePill label={t('game.score')} value={demo.game.score} theme={theme} />
          <ScorePill label={t('watch.bestTile')} value={best} theme={theme} />
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
            // The computer is driving; swiping would fight it. Take over first.
            interactive={false}
          />
        </View>

        <Text style={[styles.note, { color: theme.colors.textMuted }]}>
          {t('watch.note.before')}
          <Link href="/how-to-play" style={[styles.noteLink, { color: theme.colors.text }]}>
            {t('watch.note.link')}
          </Link>
          {t('watch.note.after')}
        </Text>

        <Row style={styles.speeds} accessibilityRole="radiogroup" accessibilityLabel={t('watch.title')}>
          {SPEEDS.map((speed, index) => (
            <Button
              key={speed.key}
              label={t(speed.key)}
              onPress={() => setSpeedIndex(index)}
              theme={theme}
              variant={index === speedIndex ? 'primary' : 'secondary'}
              selected={index === speedIndex}
            />
          ))}
        </Row>

        {confirmingTakeOver ? (
          <Text style={[styles.warning, { color: theme.colors.text }]}>
            {t('watch.takeOver.warning', { score: playerScore })}
          </Text>
        ) : null}

        <Row style={styles.actions}>
          <Button
            label={paused ? t('watch.resume') : t('watch.pause')}
            onPress={() => setPaused((p) => !p)}
            theme={theme}
            variant="secondary"
          />
          <Button
            label={confirmingTakeOver ? t('watch.takeOver.confirm') : t('watch.takeOver')}
            onPress={takeOver}
            theme={theme}
            accessibilityHint={
              confirmingTakeOver
                ? t('watch.takeOver.hintConfirm', { score: playerScore })
                : t('watch.takeOver.hint')
            }
          />
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
    gap: 12,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  status: {
    justifyContent: 'flex-start',
  },
  boardWrap: {
    alignSelf: 'center',
    position: 'relative',
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
  },
  noteLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  speeds: {
    justifyContent: 'flex-start',
  },
  actions: {
    justifyContent: 'space-between',
  },
  warning: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
});
