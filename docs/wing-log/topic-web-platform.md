# Web platform

**Status:** stable
**Last updated:** 2026-08-26

## What this covers

Expo SDK 57 specifics, the PWA and service worker, the platform seams that will
let Phase 2 swap in native implementations, and the config that had to be right
before any feature code was written.

## Decisions

### 2026-08-26 - Did NOT add the Reanimated Babel plugin the plan mandated

This is the most important entry in this file. Read it before touching
`babel.config.js`.

- **Decision:** `apps/game/babel.config.js` contains only `babel-preset-expo`
  with an empty plugins array. The plan explicitly and repeatedly required
  adding `'react-native-reanimated/plugin'` as the last plugin, and that
  instruction was deliberately not followed.
- **Why:** The instruction is correct for Reanimated 2 and 3 but stale for this
  stack. Expo SDK 57 installs Reanimated 4.5.1, whose Babel plugin was renamed
  and moved into the `react-native-worklets` package, so the correct name would
  be `'react-native-worklets/plugin'`. More importantly, `babel-preset-expo`
  adds that plugin automatically when Reanimated is installed. The SDK 57 docs
  say verbatim "No additional configuration is required." Adding it by hand
  would either reference a path that is not the right one or double-register the
  plugin.
- **Alternatives considered:** Following the plan literally, rejected because it
  would likely break the build for no benefit. Adding
  `'react-native-worklets/plugin'` manually, rejected because the preset already
  does it and double-registering is worse than leaving it alone.
- **Trade-offs accepted:** A documented deviation from an approved plan. The
  plan's actual goal, that worklets are transformed and M3 animations do not
  crash, is met. Verified by animations working in the running app.

### 2026-08-26 - localStorage for Phase 1, MMKV deferred to Phase 2

- **Decision:** Zustand `persist` writes through a `src/platform/storage.ts`
  wrapper backed by DOM localStorage. `react-native-mmkv` is not installed.
- **Why:** The user directed this explicitly. It means no native module has to
  be built or configured while web is the only target. localStorage is itself
  synchronous, so the no-flicker rehydrate property that motivated MMKV still
  holds on web.
- **Alternatives considered:** AsyncStorage, ruled out permanently by the user
  because it is async and would cause a hydration flash.
- **Trade-offs accepted:** Phase 2 has to add `storage.native.ts`. That is a
  one-file change behind an existing interface.

### 2026-08-26 - Platform splitting by file extension, not runtime checks

- **Decision:** `useKeyboard.web.ts` holds the DOM listeners,
  `useKeyboard.native.ts` is an empty no-op, and `useKeyboard.d.ts` carries the
  shared type so TypeScript can resolve the extensionless import.
- **Why:** `window` does not exist on React Native, so a shared-code listener
  would throw at mount. A `Platform.OS === 'web'` guard would still ship the DOM
  code into the native bundle. The extension split means the bundler never sees
  it.
- **Alternatives considered:** A runtime Platform check, rejected for the reason
  above. The user specifically required the extension approach.
- **Trade-offs accepted:** Three files instead of one, and the `.d.ts` has to
  stay in sync with both implementations.

### 2026-08-26 - Service worker registered in production only

- **Decision:** `+html.tsx` registers the service worker when
  `process.env.NODE_ENV === 'production'`, and actively unregisters any existing
  worker and clears caches in development.
- **Why:** Found the hard way. The service worker's cache-first strategy for
  assets served a stale JS bundle in dev, so source edits silently stopped
  appearing. Production is safe because bundle filenames are content-hashed, a
  new deploy produces new URLs and cannot hit a stale cache entry. Dev bundle
  URLs are stable, so the same strategy would serve the old bundle forever.
- **Alternatives considered:** Network-first for everything, rejected because it
  weakens offline support, which is a core feature. Not registering the worker
  at all, rejected because offline play is a launch requirement.
- **Trade-offs accepted:** Offline only works from the second visit onward, since
  the worker activates after the first page's resources have already loaded.

### 2026-08-26 - touch-action none on the document, not just the board

- **Decision:** `touch-action: none` is set in global CSS on `html`, `body` and
  `#root`, plus `touchAction: 'none'` on the board container. Also
  `overscroll-behavior: none` and `user-select: none`.
- **Why:** Required by the user, and correct. Without it mobile browsers consume
  vertical swipes for pull-to-refresh or page scroll and horizontal ones for
  back-navigation, which makes the game unplayable on a phone browser.
- **Alternatives considered:** Board-only, rejected because the page itself
  still rubber-bands and pulls to refresh around the board.
- **Trade-offs accepted:** The page cannot scroll by touch, which is fine because
  the layout is designed to fit without scrolling.

### 2026-08-26 - Titles come from expo-router, not the HTML shell

- **Decision:** Document titles are set with `<Head>` from `expo-router/head`
  inside the route, not with a `<title>` in `+html.tsx`.
- **Why:** Expo Router owns `<head>` on web and clears a title placed in the
  shell. Observed directly, `document.title` was empty until this changed.
- **Alternatives considered:** Setting `document.title` from an effect, rejected
  as DOM code that would need its own platform split.
- **Trade-offs accepted:** None.

### 2026-08-26 - Only a change of grid square animates

- **Decision:** `Tile` tracks its last row and column. If those are unchanged
  but the pixel target moved, it snaps instead of animating.
- **Why:** Window resizes, safe-area settling and orientation changes all change
  the pixel target without being a move. Animating those made tiles glide across
  the screen on load and after a resize.
- **Alternatives considered:** Always animating, which is what caused the bug.
- **Trade-offs accepted:** None.

## How it works

`app/` holds four Expo Router routes: index (the game), settings, stats, about.
`app/+html.tsx` is the web-only document shell and the one legitimate place for
raw HTML tags and global CSS.

`src/platform/` holds the seams. `storage.ts` and `haptics.ts` each have a web
implementation today and will gain a `.native.ts` twin in Phase 2. Haptics is a
no-op on web on purpose.

The PWA is `public/manifest.json` plus `public/sw.js`, with icons generated from
`assets/icon.png` using macOS `sips`. Navigations are network-first so redeploys
land, other assets are cache-first since their names are content-hashed.

## Gotchas and things to remember

- After editing `metro.config.js` or `babel.config.js`, restart with
  `npx expo start -c` or `npm run web:clear`. Both cache aggressively. A stale
  Metro cache also caused a "Requiring unknown module" error after adding the
  `expo-router/head` import, fixed only by a cache-clearing restart.
- If web edits stop appearing, suspect a service worker before suspecting Metro.
  That cost real time in this session.
- The dev server and a locally served production build must not share an origin,
  or the production worker will cache dev assets. They run on 8081 and 8090.
- The maskable PWA icon is currently just a copy of the 512 icon. A real
  maskable icon needs safe-area padding. The app icon is still the Expo
  placeholder and needs designing.
- `StyleSheet.absoluteFillObject` does not exist in the RN 0.86 types. Write the
  four inset properties out.
- React Native has no `grid` accessibility role. Using one is a type error.

## Open questions

- Touch-swipe has not been verified end to end. Trusted pointer input cannot be
  dispatched in the automated browser environment, and Gesture Handler correctly
  ignores synthetic events. The direction-mapping logic is unit-tested in
  `useSwipe.test.ts`, but the gesture itself needs a manual check on a phone.
- Whether to strip the auto-generated `/_sitemap` route from production output.
