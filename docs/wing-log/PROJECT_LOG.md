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

### 2026-08-27 - Published

**Summary:** Worked through the pre-publication audit, then published. The game
source is now a public repo at github.com/daniel-wing/2048, and wing.cx carries
its build at /ships/2048 along with two site-wide changes the audit forced.

**Topics touched:** topic-visual-identity, topic-privacy-and-licensing

**Key outcomes:**
- Data safety first: a corrupt save used to blank the page on every subsequent
  load with no way back. Both other stores gained pass-through migrations before
  they are needed, since Zustand discards persisted state on an un-migrated
  version bump. Persisted history is capped so writes stay synchronous, which is
  what makes the debounce data-loss race impossible rather than merely unlikely.
- The board is now a real grid to a screen reader, in row-major order with
  coordinates and empty squares announced. It was previously unusable.
- The site gradient was darkened because white text on it measured 2.99:1
  against a 4.5:1 bar. `scripts/check-contrast.mjs` now computes every pairing
  and fails on a regression; it found 19 the audits between them had not.
- "Zero network requests" was corrected everywhere. It was false — the app loads
  its own bundle and fonts — and on a project whose pitch is verifiable honesty
  that mattered more than it would elsewhere.
- Icons replaced: the placeholders still had their construction guides visible.

**Left open:** the §4 performance work. The expectimax search still blocks the
main thread for an estimated 110-220ms on a mid-range phone, which makes Pause
feel unresponsive during a watched endgame. It affects only /watch — the game
never runs the AI. Next commit.

### 2026-08-27 - Spanish, following the site's toggle

**Summary:** The site has had an EN/ES toggle since before the game existed; the
game ignored it and rendered English underneath a Spanish header. Added a full
translation layer — every user-facing string in both languages, driven by the
site's own language choice, switching live without a reload.

**Topics touched:** topic-visual-identity, topic-architecture

**Key outcomes:**
- **The site owns the language, the game owns its words.** Strings live in the
  app rather than in the site's `assets/i18n.js`, because Phase 2 native has no
  `site.js` and no `window.wingT` to call. The game subscribes to the site's
  `wing:languagechange` event on web and reads the device locale on native, so
  the same screens work in both hosts. `useLanguage` is platform-split for
  exactly that reason.
- The resolution order (`window.WING_LANG`, `?lang=`, localStorage, browser,
  English) deliberately duplicates site.js's rather than calling into it. The
  game renders before site.js necessarily has, and has to be correct when
  site.js is absent entirely.
- English is the fallback for every key, so a missing Spanish string shows real
  English words rather than an empty element or a raw key.
- **Achievements were the one place that broke that promise.** Their keys are
  built from engine ids at runtime, and the dictionary had been written from
  memory instead of read off the engine — `tile-128`, `dedicated` and three
  others had no key at all, so the Stats screen printed `achv.tile-128.label`
  at the player. The six tile goals now share one parametric string, unknown
  ids fall back to the engine's own English wording, and a test asserts over
  the engine's real list so the two cannot drift again.
- **Document titles never updated.** `<Head>` from expo-router writes the title
  into each prerendered file, which is what crawlers read, but does not touch
  it at runtime on a static export — a loaded page has two `<title>` elements
  and the first, written in English at export time, wins. A platform-split
  `useDocumentTitle` sets it directly, so the tab follows the toggle too.

**Left open:** still the §4 performance work. Also worth noting for later: the
shell in `+html.tsx` emits a `<title>` that every route then duplicates. Two
title elements is invalid HTML and the shell's one always loses, but a comment
there records that removing it once left routes untitled, so it was left alone
rather than re-broken on the way out the door.
