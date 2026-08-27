# Third-party notices and attribution

## The original 2048

This project is an independent, freshly written implementation of the game
**2048**, originally created by **Gabriele Cirulli** in 2014 and released under
the MIT License.

- Original project: https://github.com/gabrielecirulli/2048
- Original author: Gabriele Cirulli
- Original licence: MIT

No source code or assets from the original project are used here — the engine,
UI, and artwork in this repository were written from scratch. The attribution
is given because the original is the reason this game exists, and crediting it
is the right thing to do.

**This project is not affiliated with, sponsored by, or endorsed by Gabriele
Cirulli.**

For reference, the original project's licence text:

```
The MIT License (MIT)

Copyright (c) 2014 Gabriele Cirulli

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Bundled font

**Plus Jakarta Sans** — Copyright 2020 The Plus Jakarta Sans Project Authors
(https://github.com/tokotype/PlusJakartaSans), licensed under the
**SIL Open Font License, Version 1.1**.

The font is redistributed with this app as self-hosted `.woff2` files rather
than linked from Google's CDN, so that the app makes no third-party requests.
The files are the official Google Fonts builds (v12, variable weight axis
200–800), reduced to the `latin` and `latin-ext` subsets.

The full licence text ships alongside the font files at
`apps/game/public/fonts/OFL.txt`, and is published alongside the fonts at
`/ships/2048/fonts/OFL.txt`, as the OFL requires.

## Open-source dependencies

This app is built on the following open-source projects, each under its own
licence (see each package for full terms):

| Project | Licence |
| --- | --- |
| React | MIT |
| React Native | MIT |
| React Native Web | MIT |
| Expo / Expo Router | MIT |
| React Native Reanimated | MIT |
| React Native Gesture Handler | MIT |
| React Native Safe Area Context | MIT |
| Zustand | MIT |

None of these are advertising, analytics, or tracking libraries. This app ships
no ad SDK and no analytics SDK, makes no third-party requests at runtime, and
sends no data anywhere.
