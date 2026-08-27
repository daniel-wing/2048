# Project Log: 2048 Free and Ad-Free

This log preserves the history and reasoning behind this project across sessions.
Each entry summarizes one work session. Topic files in this folder hold the
detailed decision records. Read those when you need to know why something was
built the way it was.

## Topic index

- topic-architecture.md: the monorepo, the pure engine, and the web-first-but-mobile-ready strategy
- topic-web-platform.md: Expo SDK 57 specifics, PWA, service worker, and the platform seams
- topic-privacy-and-licensing.md: the no-ads/no-tracking guarantee and attribution to the original 2048
- topic-visual-identity.md: the Wing house theme and publishing under wing.cx/ships/2048

## Sessions

### 2026-08-26 - Phase 1 web build, from empty directory to a playable offline PWA

**Summary:** Started from an empty project directory. Planned the whole
three-platform effort, then built and verified Phase 1 (web) end to end. The
result is a complete, playable, installable, offline 2048 with five themes,
board sizes 3x3 through 8x8, undo, stats and achievements, backed by a pure
TypeScript engine with 91 passing tests. Confirmed empirically that the app
makes zero network requests during play.

**Topics touched:** topic-architecture, topic-web-platform, topic-privacy-and-licensing

**Key outcomes:**
- Chose Expo plus React Native Web so the same code becomes the iOS and Android
  apps later with near-zero rewrite. See topic-architecture.
- Put every game rule in a pure `@2048/engine` package with no React, React
  Native, or DOM imports. 71 unit tests cover it. See topic-architecture.
- Deferred react-native-mmkv to Phase 2 and used DOM localStorage for Phase 1,
  on the user's instruction, so no native module has to be built during web
  development. See topic-web-platform.
- Discovered the plan's mandated Reanimated Babel plugin instruction was stale
  for this stack and did not apply it. See topic-web-platform for the full
  reasoning, this is the most important gotcha in the project.
- Verified zero network requests and offline play on the production build.
  See topic-privacy-and-licensing.
- Attribution to Gabriele Cirulli is in the README, THIRD_PARTY_NOTICES.md, and
  the in-app About screen, with an explicit non-endorsement line.

**Left open:** touch-swipe could not be verified in the automated browser
environment because trusted pointer input cannot be dispatched there. The swipe
direction logic is unit-tested, but the end-to-end gesture needs a manual check
on a real phone browser.

### 2026-08-26 - Wing house theme, npm hardening, and staging for wing.cx

**Summary:** Second session the same day. Hardened npm against supply-chain
attacks after weighing a move to pnpm and deciding against it. Built a Wing
theme from wing.cx's own design tokens and made it the default, with the blue
to orange tile ramp the user asked for. Made the build sub-path aware and staged
it into the site repo at ships/2048, along with the Ships card, tags, i18n and
routing, all left uncommitted for review.

**Topics touched:** topic-visual-identity, topic-privacy-and-licensing, topic-web-platform

**Key outcomes:**
- Stayed on npm rather than migrating to pnpm. An audit found the dependency
  tree has zero preinstall/install/postinstall hooks, all 71 lifecycle entries
  are `prepare` hooks which never run for registry tarballs. npm 12 also now
  ships script allowlisting by default and `min-release-age` provides the
  cooldown, so pnpm's security edge no longer justifies the Expo and Metro
  friction. Added a committed `.npmrc` with `min-release-age=1`.
- Added the Wing theme as the default, derived from the site's real CSS custom
  properties rather than eyeballed. See topic-visual-identity.
- Did NOT load the brand font from Google Fonts, because that would break the
  zero-network guarantee. This is the main open item.
- Replaced the untracked 2048 export left in the site repo by an earlier attempt
  from the 2048_cursor project, with the user's explicit go-ahead.
- Corrected the site's vercel rewrites, which pointed the game's sub-routes at
  index.html. This build is statically rendered with a real file per route.

**Left open:** everything in the site repo is staged and uncommitted by request.
Nothing is live on wing.cx yet.
