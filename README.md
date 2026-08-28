# 2048 — Free and Ad-Free

**Free. No ads. No tracking. Ever.**

A complete, polished version of 2048 built because I love the game and hate
ads. No banners, no interstitials, no "watch a video to continue", no paid
upgrade, no accounts, and no analytics. The app **sends no data anywhere** — it contacts no server other than the one it was loaded from, and makes no third-party requests at all —
your scores and settings never leave your device.

> Inspired by the original [2048 by Gabriele Cirulli](https://github.com/gabrielecirulli/2048)
> (MIT licensed). This is an independent, freshly written version and is not
> affiliated with or endorsed by the original author.
> See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Features

- Classic 2048 rules with smooth 60fps tile animations
- **Variable board sizes** — 3×3 up to 8×8
- **Six themes** — Wing (the default), Classic, Dark, High contrast, Neon, Forest
- **English and Spanish**, following the language chosen on the site around it
- Undo (off / one move / unlimited)
- Full-state persistence — close the tab mid-game and pick up exactly where you left off
- Stats and achievements
- Keyboard *and* touch-swipe input, including on mobile browsers
- Works fully offline; installable as a PWA
- Accessible: screen-reader labels, high-contrast theme, reduced-motion mode

## Project layout

This is an npm-workspaces monorepo.

```
packages/engine   Pure TypeScript game core — no React, no DOM. Fully unit-tested.
apps/game         Expo app. Web today; iOS and Android from the same code later.
```

The engine is deliberately platform-agnostic: every rule lives in pure functions
over plain data, which is what makes the game trivially testable and lets the
same code drive web, iOS, and Android.

## Getting started

```bash
npm install
```

Run the web app:

```bash
npm run web
```

Run the engine test suite:

```bash
npm test
```

Type-check everything:

```bash
npm run typecheck --workspaces --if-present
```

## Building and deploying

```bash
npm run build
```

That runs the Expo web export and assembles `build/`, which is what Vercel
serves. Preview it exactly as production will serve it — prerendered routes,
catch-all and all:

```bash
python3 scripts/serve-local.py
```

Then open http://localhost:8096/ships/2048/

### Why the output sits under `ships/2048/`

The game's home is `https://wing.cx/ships/2048/`, and this repo deploys itself
to its own Vercel project which that path rewrites through to. The export keeps
`experiments.baseUrl` set to `/ships/2048`, so every asset URL, the service
worker scope, and every link already indexed stay exactly as they were when the
build was committed into the site repo instead. Serving at the domain root
would have been tidier and would have broken all four.

This repo owns nothing but this game, and touches no other repository. The one
thing living outside it is a rewrite rule in the site's own `vercel.json`.

Opened directly, the deployment renders with its own fallback chrome rather
than the site's header and footer, which load from the site's root. That is the
intended fallback — the game is built to render without the site — and the
reason this origin serves a `Disallow: /` robots.txt: only the wing.cx URL
should ever be crawled or linked.

## Roadmap

- **Phase 1 — Web** (current): ship a polished, installable, offline web version.
- **Phase 2 — iOS**: same codebase via Expo; adds haptics and MMKV storage.
- **Phase 3 — Android**: same again.

Phase 1 has no hosting or store costs. The app itself is, and will remain, free
and ad-free on every platform.

## Licence

MIT — see [LICENSE](LICENSE).
