# Visual identity and publishing on wing.cx

**Status:** stable
**Last updated:** 2026-08-26

## What this covers

The Wing house theme, how it was derived from wing.cx's own tokens, and how the
game is staged for publishing at wing.cx/ships/2048.

## Decisions

### 2026-08-26 - Wing is the default theme, other themes stay in settings

- **Decision:** Added a sixth theme, `wing`, and made it the default. The five
  earlier themes remain selectable in settings.
- **Why:** The game is published on wing.cx and should look like it belongs
  there out of the box. The user asked for the board and numbers specifically to
  follow the blue and orange palette, and said other colours were fine in
  settings.
- **Alternatives considered:** Replacing the other themes entirely, rejected
  because multiple themes are a mandatory launch feature for the App Store
  Guideline 4.3 defence, see topic-privacy-and-licensing. Keeping 'system' as
  the default, rejected because wing.cx has no dark variant so following the OS
  would sometimes look nothing like the site.
- **Trade-offs accepted:** The settings store needed a version bump to v2 with a
  migration, so anyone still on the old 'system' default moves to Wing while an
  explicit choice is left alone.

### 2026-08-26 - Theme built from the site's real tokens, not from eyeballing

- **Decision:** Read wing.cx's actual computed CSS custom properties and copied
  them: the radial background gradient (circle at 50% 35%, #4a9ec8 to #3681ab),
  white text, panels at rgba(0,0,0,0.16) with 18px radius, pill controls at
  9999px, and the Plus Jakarta Sans stack.
- **Why:** Matching by eye from a screenshot drifts. The site publishes its own
  tokens in CSS variables, so they could just be read.
- **Alternatives considered:** Approximating from the two reference palette
  images alone, rejected because those gave the hues but not the surfaces,
  radii, or type.
- **Trade-offs accepted:** None.

### 2026-08-26 - Tile ramp runs cool to warm across the palette

- **Decision:** Tiles 2 through 64 use the blues, 128 through 2048 use the
  ambers and oranges, with a deliberate hard switch at the 64 to 128 boundary.
- **Why:** It gives the palette a job rather than being decorative. Numbers
  visibly heat up as they grow, and the crossover is the same visual milestone
  the classic game gets from its jump to gold.
- **Alternatives considered:** Alternating blue and orange, rejected as noisy
  with no information in it. All-blue with orange only for 2048, rejected as
  wasting half the palette.
- **Trade-offs accepted:** 1024 and 2048 sit close in hue. The classic game has
  the same issue across its golds.

### 2026-08-26 - Every tile foreground checked for contrast

- **Decision:** Mid-blues and mid-ambers take navy text; only the dark blue and
  the deep oranges take white.
- **Why:** White on #00A7E1 is about 2.8:1, below the 3:1 needed even for large
  bold text. Navy on the same swatch is about 6:1.
- **Alternatives considered:** White text everywhere for a cleaner look,
  rejected as failing contrast on five of the eleven tiles.
- **Trade-offs accepted:** None.

### 2026-08-26 - Plus Jakarta Sans is bundled, not linked from Google's CDN

Superseded the earlier decision to ship no webfont at all. The user asked for
the real typeface; this delivers it without giving up the privacy guarantee.

- **Decision:** Ship the genuine Google Fonts files for Plus Jakarta Sans
  (v12, variable weight axis 200-800) from the app's own origin under
  `public/fonts/`, declared with `@font-face` in `+html.tsx`. The rest of
  wing.cx still links them from Google's CDN; only this app self-hosts.
- **Why:** Identical rendering, since these are the same files Google serves,
  but the page contacts no third party. Linking the CDN would send every
  visitor's IP to Google on every load, which would contradict the About
  screen's "zero network requests" and the planned store privacy labels.
  Self-hosting is also faster here: no extra DNS lookup and TLS handshake to
  two additional origins.
- **Alternatives considered:** Linking Google's CDN as the site does, rejected
  because it breaks a promise the product is built on. Static per-weight files,
  rejected in favour of the variable font, which covers 200-800 in one file.
  Shipping all four subsets, rejected as waste.
- **Trade-offs accepted:** 47.8 KB added to the repo, of which only the 27 KB
  latin file is fetched by a typical visitor. The font now has to be updated by
  hand if Google publishes a new version.

**Subset choice:** only `latin` and `latin-ext`. Cyrillic and Vietnamese are not
shipped. Every accented character Spanish needs lives in U+0000-00FF, inside
`latin`, so an ES visitor never fetches `latin-ext` either. Verified by probing
`áéíóúñü¿¡` in the running page.

**Licensing:** the font is under the SIL Open Font License 1.1, which permits
redistribution provided the licence travels with it. `OFL.txt` ships next to the
woff2 files and the attribution is recorded in THIRD_PARTY_NOTICES.md.

### 2026-08-26 - Published under a sub-path, so the build is baseUrl-aware

- **Decision:** Set `experiments.baseUrl` to `/ships/2048` in app.json, and made
  the hand-written URLs in +html.tsx use `process.env.EXPO_BASE_URL`. The
  manifest and service worker were made location-independent instead.
- **Why:** Absolute paths like `/manifest.json` would resolve to the wing.cx
  root, not the game. Expo rewrites bundled asset URLs from baseUrl but cannot
  know about URLs written by hand.
- **Alternatives considered:** Serving the game from its own subdomain, not
  discussed with the user. Relative URLs everywhere, rejected because they break
  on routes with a trailing slash.
- **Trade-offs accepted:** The build is now tied to that path. Moving it means
  changing baseUrl and rebuilding.

### 2026-08-26 - Orange is reserved for high tiles only

- **Decision:** The Wing accent changed from orange to white. Primary controls
  are white pills with dark text, secondary controls are translucent pills with
  white text, exactly like the site's own buttons. Orange now appears nowhere
  except tiles from 128 up.
- **Why:** The user asked for it directly. It is also better design: when the
  chrome is orange, the orange tiles stop meaning anything.
- **Alternatives considered:** Keeping an orange primary button, rejected on
  both counts above.
- **Trade-offs accepted:** None.

### 2026-08-26 - Score pills got their own colour tokens

- **Decision:** Added `colors.scoreBg` and `colors.scoreText`, and pointed
  ScorePill at them.
- **Why:** The pills previously drew `accentText` on `boardBackground`. For the
  older themes those happened to pair well, but for Wing it was navy text on a
  dark navy pill, which the user reported as barely visible. Two tokens that say
  what they are for cannot drift into that again.
- **Alternatives considered:** Special-casing Wing's accentText, rejected because
  it overloads a token that also has to work as button-label colour.
- **Trade-offs accepted:** Two more tokens per theme.

### 2026-08-26 - The game page wears the site's real chrome

- **Decision:** `+html.tsx` links `/assets/site.css` and the site's scripts, and
  reproduces the real `.site-header` (brand, floating nav pill, EN/ES) and
  `.site-footer` markup around the app.
- **Why:** The user wants the game to read as part of wing.cx, not as an
  embedded iframe-like page. Reusing the actual stylesheet and markup means the
  game keeps matching the site when the site changes.
- **Alternatives considered:** Rebuilding the header and footer as React Native
  components, rejected as duplicated work that would immediately drift. An
  iframe, not considered seriously.
- **Trade-offs accepted:** The game page depends on the site's assets existing
  at `/assets/`. Served standalone (the local dev server) the chrome is
  unstyled, which is harmless but looks broken in isolation.

### 2026-08-26 - Slot instead of Stack

- **Decision:** The root layout renders `<Slot />` rather than a `<Stack>`.
- **Why:** A Stack keeps every visited screen mounted and positions them
  `absolute` so it can animate transitions. Absolute children contribute no
  height, so the page could not grow with its content: Settings overflowed and
  rendered underneath the site footer.
- **Alternatives considered:** Forcing the screen containers to `position:
  relative` with CSS, rejected because inactive screens stay mounted and would
  then stack vertically. Letting the app scroll internally, rejected as a
  scroller inside a page that already scrolls.
- **Trade-offs accepted:** No stack transitions, which a four-screen game
  embedded in a web page does not need. Titles moved to a `<Head>` per route.

### 2026-08-26 - touch-action narrowed from the document to the board

- **Decision:** `touch-action: none` now applies only to the board. The body
  keeps `overscroll-behavior-y: contain`.
- **Why:** This modifies an earlier explicit instruction to put it on the root
  element, and the reason is that the page changed underneath that instruction.
  With a header and footer the page must be able to scroll on a phone, and
  `touch-action: none` on the document makes that impossible. The instruction's
  actual purpose, protecting the swipe and killing pull-to-refresh, is still met.
- **Alternatives considered:** Keeping it on the root and making the game fit
  every viewport exactly, rejected as impossible across phone sizes.
- **Trade-offs accepted:** None known, but this is worth re-testing on a real
  phone since pull-to-refresh behaviour varies by browser.

### 2026-08-26 - The board is sized by CSS and measured, never from the window

- **Decision:** The board wrapper is `width: 100%` with `maxWidth: 460`, and an
  `onLayout` reports its real pixel width for tile positioning.
  `useWindowDimensions` is not used on this screen.
- **Why:** A genuine bug, found by measuring rather than by eye. The page is
  statically prerendered, and `useWindowDimensions` returned the build
  machine's viewport and never corrected on the client, not even on resize. The
  board was pinned at the 220px floor for every visitor regardless of screen.
- **Alternatives considered:** `aspectRatio: 1` plus a `maxHeight` cap on the
  wrapper, tried and rejected: Yoga produced a wrapper shorter than its own
  child, so the hint text rendered on top of the board.
- **Trade-offs accepted:** One frame at a 320px placeholder before the measure
  lands. The board no longer shrinks to fit short viewports; the page scrolls
  instead.

## How it works

The site's radial gradient is painted on the HTML body in `+html.tsx` rather
than inside the app, so it lands before React mounts and there is no flash. The
Wing theme's `background` is therefore `'transparent'`, letting it show through.
Other themes carry solid backgrounds that paint over it.

React Navigation paints its own screen background, #f2f2f2 by default, which sat
above the body and hid the gradient completely. The fix is a ThemeProvider in
`_layout.tsx` fed from our palette. Note the theming primitives are imported
from `expo-router`, not `@react-navigation/native`.

## Gotchas and things to remember

- Since Expo SDK 56, expo-router vendors its own navigator and importing
  `@react-navigation/native` is a hard build error. expo-router re-exports
  `ThemeProvider`, `DefaultTheme` and `DarkTheme` itself.
- If the background ever goes flat grey again, look for a navigator painting
  over the body before suspecting the CSS.
- `Theme` now carries `backgroundFallback`, a solid colour for Phase 2 native
  where there is no HTML body to hold a gradient. Nothing reads it yet.
- The vercel rewrites for the game's sub-routes must point at the per-route HTML
  files, not at index.html. This is a static export with a real prerendered file
  per route; pointing /about at index.html serves the game page under the About
  URL.

## Open questions

- The app icon and the maskable PWA icon are still Expo placeholders.
- The site itself still loads the font from Google's CDN. Pointing wing.cx at
  the same self-hosted files would remove the last third-party request from the
  whole domain, and is a one-line change in each page's head.

### 2026-08-26 - The app must render itself without the site

- **Decision:** Added `fallbackChromeCss` in `+html.tsx`, emitted BEFORE the link
  to `/assets/site.css`, carrying the background gradient, the type, and minimal
  header/footer/pill styling. Also made `baseUrl` apply only in production.
- **Why:** Borrowing wing.cx's stylesheet had quietly made the app unable to
  render on its own. On the Expo dev server, where `/assets/*` does not exist,
  the page came up black with unstyled blue links and no brand font. The same
  would happen on any preview deploy or anywhere the game is hosted outside the
  site. An app that only looks right in one location is a fragile app.
- **Alternatives considered:** Copying the site's assets into the game's
  `public/`, rejected as duplication that would drift and ship dead weight in the
  export. Telling the developer to always preview through the site server,
  rejected because it makes every visual change wait on a full export.
- **Trade-offs accepted:** A small amount of the site's chrome styling is
  restated as a floor. Ordering keeps it from being a second source of truth:
  when site.css is present it wins on every property.

**The baseUrl subtlety.** The export rewrites asset URLs with
`experiments.baseUrl`, but the dev server serves `public/` from the root and
ignores it. Applying the prefix in dev pointed the font and the manifest at
`/ships/2048/...`, which 404s there. It is now applied only when
`NODE_ENV === 'production'`.

**Known, harmless:** on the dev server `/assets/i18n.js` and `/assets/site.js`
404. They are the site's own scripts and only drive the EN/ES toggle, so nothing
in the game depends on them. On the published page the font family ends up
declared four times, twice by site.css and twice by the app; the browser still
downloads only one file, and `document.fonts.check()` reports false because it
requires every matching face to be loaded. Measure rendered text width instead of
trusting that call.

### 2026-08-26 - The board scales with the screen instead of a fixed cap

- **Decision:** The board is sized from the viewport, capped at 600 and floored
  at 300, and the same number caps the content column so the title, scores and
  controls line up flush with the board's edges.
- **Why:** The cap was a fixed 460 regardless of screen. On a large monitor that
  left a narrow column stranded in the middle of a very wide window, which the
  user reported as looking "all crowded in the middle". The column was also
  narrower than the 960px `.page` every other page on the site uses, so the game
  read as a different, smaller kind of page.
- **Alternatives considered:** A two-column desktop layout with the board beside
  the controls, rejected as a bigger redesign that would stop matching the
  site's centred single-column idiom. Widening the column to the site's 960
  without growing the board, rejected because it would leave the board floating
  in a column much wider than itself.
- **Trade-offs accepted:** On a short window (around 700px tall) the floor wins
  and the page scrolls roughly 60px. The board and the hint still sit above the
  fold; only the site footer needs a nudge, the same as other pages on the site.

**Sizing is computed, not measured.** An earlier attempt derived the width from
`onLayout` on the board wrapper. That fires once with a width of 0 before layout
settles and then never again, so the board stuck at its fallback size — the
wrapper measured a correct 600px in the DOM while the board inside stayed at 320.
`useViewportSize` (a platform split, web reads `window` inside an effect) is safe
here where `useWindowDimensions` is not, because this page is prerendered and the
React Native hook reports the build machine's viewport forever.

**VERTICAL_CHROME is measured, not guessed.** It is the 440px of header, footer,
title, controls, hint, links and padding that surround the board. The first
estimate of 360 was wrong by 71px and pushed the footer off-screen. Note the real
value drifts with column width, because a narrower column wraps the hint text
onto more lines, so it cannot be exact for every size.

## Gotchas and things to remember

- The emulated viewport in the automated browser does NOT dispatch `resize` or
  notify a `ResizeObserver`. `window.innerHeight` updates but nothing tells the
  page, so a live resize appears not to reflow when it is actually fine. Verified
  with a counter probe: zero events across a 700 to 1000 change. Reload after
  resizing to test a size, and do not "fix" reflow code based on that symptom.

### 2026-08-26 - The column has a floor of its own, below the board's

- **Decision:** The content column is `max(boardSize, 380)`, not `boardSize`.
- **Why:** Tying the column to the board looks right while the board is large,
  but on a short window the board hits its 300px floor and the column came down
  with it, wrapping "Settings" onto a row of its own and stacking the controls
  three deep. Below 380 the board is simply centred in a slightly wider column,
  which reads far better than wrapped buttons.
- **Alternatives considered:** Shrinking the button labels or the gaps at narrow
  widths, rejected as fiddlier and worse for touch targets.
- **Trade-offs accepted:** Below 380 the header row is marginally wider than the
  board, so the flush alignment is lost exactly where it matters least.
  `width: '100%'` keeps this from ever overflowing a narrow phone.

## Local preview

Two servers, both defined in `.claude/launch.json`:

- `2048-web` on 8081 — Expo dev server, game only, hot reload. The site's
  `/assets/*` do not exist here, so `fallbackChromeCss` is what styles the
  header and footer.
- `wing-site` on 8096 — the whole wing.cx repo with vercel.json rewrites
  applied, which is the faithful preview. Run it standalone with
  `python3 scripts/serve-site.py`; the script lives in this repo rather than a
  scratch directory so it survives between sessions.

### 2026-08-26 - Settings moved below the board; the three links became chips

- **Decision:** Settings left the controls row and joined Stats and About under
  the board. All three are now outlined chips — hairline border, no fill, full
  44px touch target — ordered Settings, Stats, About.
- **Why:** The user's words: as bare text links they "look like an afterthought
  and not that connected to the game". A border and a real touch target make
  them read as controls. They are deliberately lighter than `Button` so they do
  not compete with "New game", which is the one thing that should draw the eye
  above the board.
- **Alternatives considered:** Full pills like the primary controls, rejected as
  too heavy for secondary navigation and explicitly not what was asked for.
  Keeping Settings up top, rejected because the request was to group the three.
- **Trade-offs accepted:** Ordering is by expected use rather than alphabetical,
  which is a judgement call.

**They must be styled Links, not Pressables.** The first attempt wrapped a
Pressable in `<Link asChild>`. It looked identical and navigated correctly, but
rendered an anchor with **no href**, which silently breaks cmd-click, "open in a
new tab", "copy link address", and anything that reads the document's links.
Applying the style to the `<Link>` itself keeps the real href. Verified in the
accessibility tree: the chips now carry `/ships/2048/settings` and friends. The
cost is the hover fill, which needed a Pressable; the border and the pointer
cursor carry the affordance instead.

### 2026-08-26 - Undo is the conventional circular arrow

- **Decision:** The Undo button is now a 44px circle showing U+21BA, with
  `accessibilityLabel="Undo"` and the existing hint.
- **Why:** Asked for, and the symbol is universally understood, which frees the
  controls row for the one action that does need a word.
- **Alternatives considered:** An SVG icon, rejected because it would mean a new
  dependency (react-native-svg) for a single glyph. An icon font, rejected for
  the same reason plus a network request.
- **Trade-offs accepted:** Latin webfonts do not carry arrows, so the glyph falls
  through to the platform font. Arrows render consistently across system fonts,
  so this is not a real risk, but it does mean the icon is not in the brand face.

**Accessibility note:** an icon-only control is invisible to a screen reader
without a label, so `IconButton` makes `accessibilityLabel` a required prop
rather than an optional one.

### 2026-08-26 - Undo joined the score readouts; New game moved below the board

- **Decision:** One header row: the title on the left, then undo, score and best
  as a single cluster on the right. New game left that area entirely and now
  sits below the board with the navigation chips.
- **Why:** The user's report — the pills "look off, not aligned". They sat
  top-right in line with the title while undo was a row below with New game, so
  the eye read two unrelated clusters. Undo acts on the score it now sits beside.
  New game moved because it discards the current game and sitting directly over
  the play area made it easy to hit while swiping.
- **Alternatives considered:** Keeping undo on its own row under the title,
  rejected because with New game gone that row held one small circle and looked
  emptier still. A confirmation prompt on New game instead of moving it,
  rejected as friction on an action people use constantly.
- **Trade-offs accepted:** Undo is an action grouped with two readouts, which is
  slightly odd semantically. Visually it is right, and it is what was asked for.

**Alignment is measured, not eyeballed.** Undo is 44 tall and the pills a little
more, so the row centres them rather than aligning edges: their midlines land on
the same pixel. In the bottom row the chips' 1px border made them 46 against
Button's 44, so the chip padding is 11 rather than 12 — 11 + 20 + 11 + 2 = 44
exactly. Verified: all four bottom-row items report a height of 44 and share one
centre line.

**Two rows on a phone.** Four items need about 400px and a phone column is
around 358, so flex-wrap stranded "About" alone. Below the column floor New game
now takes its own row above the links, which reads as an action followed by
navigation instead of a ragged wrap. A phone has the vertical room to spare.

### 2026-08-26 - The tutorial is played by the real engine, not animated by hand

- **Decision:** `/how-to-play` is six lessons. Each declares a starting grid and
  a list of moves; the screen runs them through the engine's `move()` and renders
  them with the same `Board` the game uses, looping until the reader moves on.
- **Why:** A hand-built animation is a second implementation of the rules that
  can drift from the first. Driving the real engine means the tutorial cannot
  show something the game does not actually do, and it needed no animation code
  at all — the tile slide, merge pop and spawn all came for free.
- **Alternatives considered:** Recorded videos or GIFs, rejected as heavy, not
  themeable, and stale the moment the palette changes. A hand-scripted animation
  component, rejected for the drift reason above.
- **Trade-offs accepted:** Two small engine additions were needed, both of which
  earn their place independently.

**What the engine gained.** `gameFromGrid` builds a state from a literal grid so
positions can be declared rather than generated, and `move()` takes
`{ spawn: false }` so a lesson can demonstrate one rule without a random tile
landing in the middle of it. Both are useful in tests too — asserting on an exact
board is much clearer than seeding an rng and hoping. Ten new engine tests cover
them, including that a suppressed spawn leaves the rng untouched so the state
stays reproducible.

**Entry point.** The hint line under the board becomes the link, rather than a
fifth chip in the bottom row. That row is already tuned to the width it can fit,
and the hint is the exact line someone reads when wondering how the game works.

## Gotchas and things to remember

- A hidden Browser pane suspends the page. A looping animation will read as
  frozen and `read_page` will report a 0x0 viewport. Front the tab with
  `tabs_select` before measuring anything time-based, and confirm with a probe
  timer that intervals are actually firing before concluding the code is broken.
- `scripts/serve-site.py` re-reads vercel.json per request, so a new route's
  rewrite takes effect on the next reload rather than needing a restart. It did
  cache at startup at first, which produced a confusing 404 on a route that was
  correctly built and staged.

### 2026-08-26 - "Watch a game" is a live AI, not a recording

- **Decision:** `/watch` calls the engine's `bestMove` on the real position every
  tick. Different game every time, with speed control, pause, and a "take over"
  that hands the exact position to the player.
- **Why:** A recorded replay is the same game forever and needs a kilobyte of
  move data shipped with it. A live player is smaller, always fresh, and can be
  interrupted — "take over" turns watching into playing, which is the point of
  the feature.
- **Alternatives considered:** Recording one winning game offline and replaying
  seed plus moves, rejected for the reasons above. Skipping it, rejected once
  the user chose the live option.
- **Trade-offs accepted:** It reaches 2048 about half the time rather than
  always. The screen says so rather than overselling it.

**On the framing.** The request was to show "a perfect game so people can see how
it is easy". A perfect game is not easy — it is a search evaluating thousands of
positions per move, and presenting it as easy risks reading as "you could never
do this". The screen says "Watch a game" and explains the one habit it is using,
which challenges without the put-down.

**The heuristic matters far more than the depth.** The first version scored
positions with a fixed positional weight table. It managed a median of 512, and
searching DEEPER made it worse — median 256 — because more search just pursued a
flawed objective harder. Replacing it with monotonicity, smoothness, free space
and max rank took the median to 2048 at the same depth. Benchmarked over 12 full
games: median 2048, 6 reached 2048, 11 of 12 reached 1024, worst-case move 29ms.

**Timing.** `bestMove` is called at the START of a tick, not straight after
applying a move. A deep search takes tens of milliseconds and doing it while
tiles are still sliding would stutter the animation; at the top of a tick
nothing is moving so the cost lands in idle time.

**Take over asks before it destroys.** Adopting a position overwrites whatever
game the player had going, unrecoverably. When their game has a score and is not
over, the button turns into "Replace my game" and states what will be lost.
There is no portable confirm dialog in React Native, and a button that names its
consequence is clearer than a modal. `adoptGame` also clears the undo history:
those moves belong to a game the player did not play, so undo must not walk back
into them.

**Test cost is a design constraint.** Playing full games to guard AI strength
took the engine suite from 1 second to 120. One shared playthrough instead of
six brought it to 20 seconds and still catches a real regression — the old
heuristic peaked at 512 across every seed, well under the thresholds asserted.

## Pre-publication hardening (2026-08-27)

Three parallel audits went over the code for security, usability, correctness,
performance and deployment before publishing. The full remediation plan is in
the plan file; the decisions worth keeping are recorded here.

### The gradient was darkened because the default theme failed contrast

White on the site's original #4a9ec8 measured **2.99:1**, against a 4.5:1 bar for
body text — so the default theme failed at its most basic job, and wing.cx had
the same problem since the game inherited its tokens. The gradient is now
#306d8c to #275973 and `--text-muted` went from 78% to 86% white, which puts
white at 5.69:1 and muted at 4.70:1. The site was changed to match.

Classic's tile numerals were far worse and unrelated to the brand: near-white on
mid-gold measured **1.58:1**. Those tiles now take a dark numeral.

`scripts/check-contrast.mjs` computes every pairing in the palette and exits
non-zero on a failure. It found 19 failing pairings the audits had not all
caught, including Classic's score pill and primary button. **Run it after any
palette change** — this is the one design property that cannot be judged by eye.

### The board was unreadable to a screen reader

`accessibilityLabel` on a generic div is name-prohibited and dropped, so the
board was anonymous. Worse, tiles are keyed by creation id and absolutely
positioned, so a screen reader walked them in an arbitrary order with no
coordinates and never heard the empty squares — the position could not be
reconstructed at all.

The cell layer is now the semantic layer: `role="grid"` with a `role="cell"` per
square in row-major order, labelled "row 2, column 3, 8" or "…, empty". The
animated tile layer is `aria-hidden`, or every number would be read twice.

### Data safety

A save that parsed but was not renderable — a write truncated by a quota error
leaves exactly that — threw on first render and blanked the page on **every**
subsequent load, with no way back short of clearing site data by hand. The store
now validates on rehydrate and falls back to a fresh game.

Both other stores gained pass-through `migrate` functions **before** they are
needed: without one, Zustand discards persisted state entirely on a version
bump, so the day statsStore goes to v2 every player would silently lose their
lifetime statistics.

Persisted history is capped at 20 snapshots. The whole 200 meant stringifying up
to ~360 KB synchronously on every move into a quota shared with the rest of the
site. Capping it is what lets the write stay synchronous — and a synchronous
write cannot lose the last move to a phone locking mid-timer, which is the race
a debounce would have introduced.

`gameOverRecorded` stops one game being counted as several. Undo out of a
finished game and lose again — the game-over overlay offers exactly that — and
`gamesOver` and the lifetime score were both counted twice.

### Honesty

"This app makes zero network requests" was false: it loads its own bundle,
fonts and CSS. All same-origin with no third parties, which is the meaningful
promise, but a reader with DevTools open could have caught it out — on a project
whose whole pitch is verifiable honesty. Now: "sends no data anywhere; contacts
no server other than the one it was loaded from; no third-party requests at
all." The store label "Data Not Collected" was always correct and is unchanged.

### Gotchas

- Jest resolves the `.native` half of every platform split, because forcing web resolution breaks jest-expo's own global setup. The web storage adapter's guards therefore have no unit test; that path is verified in the browser instead. Recorded in `apps/game/jest.config.js`.
- `scripts/serve-site.py` now emulates Vercel's `:path*` wildcard rewrites, so the catch-all that sends unknown paths to the branded not-found screen can be tested locally rather than discovered in production.
- The service worker cached whatever page you last visited as the offline shell, so opening the game offline could serve the About document. It now only refreshes the shell from the shell's own url.
