import {
  achievements,
  emptyStats,
  recordGameOver,
  recordGameStarted,
  recordMove,
  recordWin,
} from '../stats';

describe('stats reducers', () => {
  it('counts games started', () => {
    expect(recordGameStarted(emptyStats).gamesStarted).toBe(1);
  });

  it('tracks moves, merges and running bests', () => {
    let stats = emptyStats;
    stats = recordMove(stats, { merges: 2, score: 40, highestTile: 16 });
    stats = recordMove(stats, { merges: 1, score: 60, highestTile: 32 });

    expect(stats.totalMoves).toBe(2);
    expect(stats.totalMerges).toBe(3);
    expect(stats.bestScore).toBe(60);
    expect(stats.highestTile).toBe(32);
  });

  it('never lowers a best', () => {
    let stats = recordMove(emptyStats, { merges: 0, score: 100, highestTile: 64 });
    stats = recordMove(stats, { merges: 0, score: 10, highestTile: 4 });

    expect(stats.bestScore).toBe(100);
    expect(stats.highestTile).toBe(64);
  });

  it('tracks win streaks', () => {
    let stats = recordWin(emptyStats);
    stats = recordWin(stats);

    expect(stats.gamesWon).toBe(2);
    expect(stats.currentWinStreak).toBe(2);
    expect(stats.longestWinStreak).toBe(2);
  });

  it('breaks the streak on a loss but keeps the longest', () => {
    let stats = recordWin(recordWin(emptyStats));
    stats = recordGameOver(stats, { score: 500, highestTile: 256, won: false });

    expect(stats.currentWinStreak).toBe(0);
    expect(stats.longestWinStreak).toBe(2);
  });

  it('keeps the streak when the finished game was won', () => {
    let stats = recordWin(emptyStats);
    stats = recordGameOver(stats, { score: 20000, highestTile: 2048, won: true });
    expect(stats.currentWinStreak).toBe(1);
  });

  it('accumulates lifetime score on game over', () => {
    let stats = recordGameOver(emptyStats, { score: 100, highestTile: 32, won: false });
    stats = recordGameOver(stats, { score: 250, highestTile: 64, won: false });

    expect(stats.totalScore).toBe(350);
    expect(stats.gamesOver).toBe(2);
    expect(stats.bestScore).toBe(250);
  });

  it('does not mutate the input', () => {
    const before = { ...emptyStats };
    recordMove(emptyStats, { merges: 5, score: 999, highestTile: 512 });
    expect(emptyStats).toEqual(before);
  });
});

describe('achievements', () => {
  it('are all locked for a fresh player', () => {
    expect(achievements(emptyStats).every((a) => !a.achieved)).toBe(true);
  });

  it('unlock tile milestones at or below the highest tile', () => {
    const list = achievements({ ...emptyStats, highestTile: 512 });
    const by = (id: string) => list.find((a) => a.id === id)?.achieved;

    expect(by('tile-128')).toBe(true);
    expect(by('tile-512')).toBe(true);
    expect(by('tile-1024')).toBe(false);
  });

  it('unlocks score and streak milestones', () => {
    const list = achievements({
      ...emptyStats,
      bestScore: 10000,
      longestWinStreak: 3,
      gamesWon: 1,
      totalMoves: 1000,
    });

    for (const id of ['score-10k', 'streak-3', 'first-win', 'dedicated']) {
      expect(list.find((a) => a.id === id)?.achieved).toBe(true);
    }
  });

  it('gives every achievement a stable id and label', () => {
    const list = achievements(emptyStats);
    expect(new Set(list.map((a) => a.id)).size).toBe(list.length);
    expect(list.every((a) => a.label.length > 0 && a.description.length > 0)).toBe(true);
  });
});
