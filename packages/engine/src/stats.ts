/**
 * Cumulative player statistics and achievements.
 *
 * Pure reducers over a plain object so the store can persist the result
 * directly and the tests can assert on it without a UI.
 */

export type Stats = {
  gamesStarted: number;
  gamesWon: number;
  gamesOver: number;
  bestScore: number;
  highestTile: number;
  totalScore: number;
  totalMoves: number;
  totalMerges: number;
  currentWinStreak: number;
  longestWinStreak: number;
};

export const emptyStats: Stats = {
  gamesStarted: 0,
  gamesWon: 0,
  gamesOver: 0,
  bestScore: 0,
  highestTile: 0,
  totalScore: 0,
  totalMoves: 0,
  totalMerges: 0,
  currentWinStreak: 0,
  longestWinStreak: 0,
};

export function recordGameStarted(stats: Stats): Stats {
  return { ...stats, gamesStarted: stats.gamesStarted + 1 };
}

export function recordMove(
  stats: Stats,
  input: { merges: number; score: number; highestTile: number },
): Stats {
  return {
    ...stats,
    totalMoves: stats.totalMoves + 1,
    totalMerges: stats.totalMerges + input.merges,
    bestScore: Math.max(stats.bestScore, input.score),
    highestTile: Math.max(stats.highestTile, input.highestTile),
  };
}

export function recordWin(stats: Stats): Stats {
  const currentWinStreak = stats.currentWinStreak + 1;
  return {
    ...stats,
    gamesWon: stats.gamesWon + 1,
    currentWinStreak,
    longestWinStreak: Math.max(stats.longestWinStreak, currentWinStreak),
  };
}

/**
 * A finished game. A game that ended without reaching the target breaks the
 * win streak; one that was already won this session does not.
 */
export function recordGameOver(
  stats: Stats,
  input: { score: number; highestTile: number; won: boolean },
): Stats {
  return {
    ...stats,
    gamesOver: stats.gamesOver + 1,
    totalScore: stats.totalScore + input.score,
    bestScore: Math.max(stats.bestScore, input.score),
    highestTile: Math.max(stats.highestTile, input.highestTile),
    currentWinStreak: input.won ? stats.currentWinStreak : 0,
  };
}

export type Achievement = {
  id: string;
  label: string;
  description: string;
  achieved: boolean;
};

/** Derived, never stored — recomputed from `Stats` so it can never drift. */
export function achievements(stats: Stats): Achievement[] {
  const tileGoals = [128, 256, 512, 1024, 2048, 4096];
  const tileAchievements = tileGoals.map((value) => ({
    id: `tile-${value}`,
    label: `Reach ${value}`,
    description: `Merge your way to a ${value} tile.`,
    achieved: stats.highestTile >= value,
  }));

  return [
    ...tileAchievements,
    {
      id: 'first-win',
      label: 'First win',
      description: 'Reach the 2048 tile.',
      achieved: stats.gamesWon >= 1,
    },
    {
      id: 'score-10k',
      label: 'Ten thousand',
      description: 'Score 10,000 in a single game.',
      achieved: stats.bestScore >= 10000,
    },
    {
      id: 'streak-3',
      label: 'Hat-trick',
      description: 'Win three games in a row.',
      achieved: stats.longestWinStreak >= 3,
    },
    {
      id: 'dedicated',
      label: 'Dedicated',
      description: 'Play 1,000 moves.',
      achieved: stats.totalMoves >= 1000,
    },
  ];
}
