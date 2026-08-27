# Architecture

**Status:** stable
**Last updated:** 2026-08-26

## What this covers

The monorepo layout, the pure game engine, and the decision to build web first
while keeping the code ready for iOS and Android.

## Decisions

### 2026-08-26 - Expo plus React Native Web instead of a plain React web app

- **Decision:** Build the web version as an Expo app rendering through React
  Native Web, not as a React plus Vite app.
- **Why:** The user wants web now, then iOS, then Android, with as little rework
  as possible. Building the web version on Expo means the mobile phases are
  mostly native config rather than a second implementation.
- **Alternatives considered:** A plain React or Vite web app, rejected because
  iOS and Android would then be a full rewrite. Flutter, rejected because it
  would mean learning Dart. React Native without Expo, rejected because Expo
  removes most of the native toolchain pain and gives EAS builds later.
- **Trade-offs accepted:** Slightly more friction during web development. No
  CSS or Tailwind, `View` and `Text` instead of `div` and `span`, and a larger
  JS bundle than a hand-rolled web game would need. About 498 KB gzipped.

### 2026-08-26 - All game rules live in a pure engine package

- **Decision:** `packages/engine` is plain TypeScript with zero imports from
  React, React Native, Expo, or the DOM. The UI never implements a rule.
- **Why:** It makes the rules exhaustively testable without a UI, and it is what
  lets the same logic drive all three platforms unchanged.
- **Alternatives considered:** Putting the logic in the Zustand store, rejected
  because it would tie the rules to a UI library and make them harder to test.
- **Trade-offs accepted:** A little ceremony threading state through pure
  functions, notably the seeded RNG state.

### 2026-08-26 - Immutable state and a seeded RNG

- **Decision:** Every engine transition returns new state and never mutates.
  Randomness uses a seedable mulberry32 generator whose state is threaded
  explicitly rather than calling Math.random.
- **Why:** Immutability makes undo nearly free, a history entry is just a
  reference to a previous state. The seeded RNG makes games reproducible, which
  is what lets tests assert on exact spawns.
- **Alternatives considered:** Math.random with deep-cloned snapshots for undo,
  rejected as both slower and untestable.
- **Trade-offs accepted:** None significant.

### 2026-08-26 - Stable tile ids drive the animations

- **Decision:** Every tile carries an `id` that survives across moves. The UI
  renders tiles keyed by id and animates position changes.
- **Why:** Animating by grid slot makes a move look like a redraw. Animating by
  id makes it look like tiles sliding, which is the whole feel of 2048.
- **Alternatives considered:** Re-rendering the grid each move, rejected as
  visually flat.
- **Trade-offs accepted:** The engine has to report which tile survived a merge
  and which was consumed, so the consumed one can be animated into its
  destination before unmounting.

### 2026-08-26 - npm workspaces instead of pnpm

- **Decision:** Use npm workspaces.
- **Why:** pnpm was not installed on the machine, and npm's hoisting is friendlier
  to Metro than pnpm's strict symlinking.
- **Alternatives considered:** Installing pnpm globally, rejected as an
  unnecessary system change when npm workspaces work fine. The plan explicitly
  allowed either.
- **Trade-offs accepted:** None noticed.

## How it works

```
packages/engine   pure TypeScript rules, 71 tests
apps/game         the Expo app, web today, iOS and Android later
```

The engine exports `createGame`, `move`, `canMove`, `isGameOver`, plus stats
reducers. `move` normalizes all four directions to a single "slide toward index
0" operation by reading each line's coordinates in the right order, so the merge
rules exist in exactly one function.

The app layers three Zustand stores over it: `gameStore` (board, score, undo
history, per-size bests), `settingsStore`, and `statsStore`. Stores call the
engine and never contain rules.

## Gotchas and things to remember

- The engine package has `main` pointing at `src/index.ts`, so there is no build
  step. Metro and Jest both transform it directly. The app's
  `transformIgnorePatterns` has to allow `@2048/engine` through, and the Metro
  config needs `watchFolders` plus `nodeModulesPaths` for the workspace root.
- Best scores are tracked per board size on purpose. A 3x3 best is not
  comparable to an 8x8 one. The score pill says "BEST 4x4" so this does not look
  like a bug when the player switches sizes.
- A move that changes nothing must not spawn a tile. This is guarded in the
  engine and covered by a test. Getting it wrong quietly fills the board when the
  player presses into a wall.
- Babel presets were pinned to v7. npm resolved `@babel/preset-env` and
  `@babel/preset-typescript` to v8 betas against Babel core v7, which broke
  TypeScript parsing in a confusing partial way. Only some files failed.

## Open questions

- Whether to ship iOS at all, or stay web-only. Phase 1 costs nothing either way.
- Default undo depth. Currently unlimited, capped at 200 history entries.
