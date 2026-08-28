/**
 * The web HTML shell.
 *
 * This file is web-only by design — Expo Router uses it to render the document
 * that wraps the app, and it never ships to native. It is the one legitimate
 * place for raw HTML tags and global CSS (portability guardrails #2 and #3 are
 * about components; this is the document itself).
 *
 * The game is published inside wing.cx, so this page wears the site's real
 * chrome: its stylesheet, header, floating nav pill and footer, all pulled from
 * the same-origin /assets. Reusing the actual files rather than reimplementing
 * them means the game keeps matching the site when the site changes, and costs
 * no third-party requests.
 *
 * Those files only exist at the domain root, so the app must not depend on them
 * to be presentable — see `fallbackChromeCss` below, which carries the floor for
 * every context where the app is served on its own.
 */

import React from 'react';

/**
 * Plus Jakarta Sans, self-hosted.
 *
 * These are the genuine Google Fonts files (v12, the variable weight axis
 * 200-800), downloaded from fonts.gstatic.com and served from this app's own
 * origin instead of linked from Google's CDN. The rendering is identical — same
 * files — but the page contacts no third party, so the no-third-party-requests
 * promise on the About screen and in the store privacy declarations stays true.
 *
 * Two subsets only: `latin` covers English and every accented character Spanish
 * needs (they all sit in U+0000-00FF), and `latin-ext` covers the rest of
 * Western European. Cyrillic and Vietnamese are deliberately not shipped.
 * 47.8 KB total, and the browser fetches latin-ext only if a page actually uses
 * a character from it.
 *
 * Licensed under the SIL Open Font License 1.1, which permits this — see
 * THIRD_PARTY_NOTICES.md.
 */
const fontCss = (baseUrl: string) => `
@font-face {
  font-family: 'Plus Jakarta Sans';
  font-style: normal;
  font-weight: 200 800;
  font-display: swap;
  src: url('${baseUrl}/fonts/plus-jakarta-sans-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193,
    U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'Plus Jakarta Sans';
  font-style: normal;
  font-weight: 200 800;
  font-display: swap;
  src: url('${baseUrl}/fonts/plus-jakarta-sans-latin-ext.woff2') format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF,
    U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020,
    U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
`;

/**
 * Standalone fallback for the page chrome.
 *
 * The game normally borrows wing.cx's real stylesheet, which lives at the
 * domain root. That file is absent whenever the app is served on its own — the
 * Expo dev server, a preview deploy, anywhere it is hosted outside the site —
 * and without it the page had no background, no brand font, and a stack of raw
 * blue links where the header and footer belong.
 *
 * These rules are deliberately emitted BEFORE the link to site.css, so when the
 * real stylesheet is present it wins on every property and nothing here has any
 * effect. This is a floor, not a second source of truth: it only has to keep the
 * app self-sufficient and presentable, not pixel-match the site.
 */
const fallbackChromeCss = `
body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: #ffffff;
  background: #275973;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* Fixed, so the gradient does not stretch or tile on a long page. */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at 50% 35%, #306d8c 0%, #275973 100%);
  z-index: -1;
}

a { color: inherit; text-decoration: none; }

.site-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.75rem 2.5rem;
}

.brand { font-size: 1.35rem; font-weight: 700; }

.nav-pill-center,
.lang-toggle {
  display: flex;
  gap: 0.25rem;
  padding: 0.3rem;
  background: rgba(0, 0, 0, 0.18);
  border-radius: 9999px;
}

.nav-item {
  padding: 0.45rem 1rem;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 600;
}

.nav-item.is-active { background: #ffffff; color: #111827; }

.lang-opt {
  padding: 0.3rem 0.7rem;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.site-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  padding: 0 2.5rem 3rem;
  font-size: 0.85rem;
  opacity: 0.75;
}

/* Narrow screens, mirroring what site.css does at the same breakpoint. Without
   this the three header groups do not fit and the language toggle is pushed off
   the right edge. */
@media (max-width: 620px) {
  .site-header { padding: 1rem 0.9rem; gap: 0.5rem; }
  .brand { font-size: 1.05rem; }
  .nav-pill-center { padding: 3px 4px; gap: 2px; }
  .nav-item { padding: 0.4rem 0.85rem; font-size: 0.8rem; }
  .lang-opt { padding: 0.3rem 0.55rem; font-size: 0.72rem; }
  .site-footer { padding: 0 1.25rem 2.5rem; gap: 0.75rem; }
}
`;

const globalCss = `
/*
  Rules the game itself needs, emitted after site.css so they win over it.
  The page background, the column layout that pins the footer, and the type come
  from site.css where it is available and from fallbackChromeCss where it is not.
*/

/*
  The app mounts here, between the site header and footer.

  React Native Web wants the root to be a full viewport tall. Inside the site's
  flex-column body that produced header + 100vh + footer, i.e. a page that
  always overflowed by exactly the height of its own chrome. Forcing height back
  to auto lets flex-grow do the real work: absorb the leftover space so the
  footer sits at the bottom, without inventing a viewport's worth of height.
*/
/*
  The DOCUMENT scrolls, so the document must be allowed to grow.

  expo-router ships a ScrollViewStyleReset component that emits
  height:100% on #root, body and html, plus overflow:hidden on body. Right for
  its default model, where a React Native ScrollView inside the app does the
  scrolling — but this app renders each screen in a plain View precisely so the
  page scrolls like every other page on the site, with the header and footer
  around it. Under that reset the body was pinned to exactly the viewport with
  its overflow clipped.

  Desktop browsers hid the problem: they still honour a wheel or a scrollbar,
  and scripted scrolling kept working, so it tested fine. iOS Safari does not —
  with overflow:hidden on the body, touch scrolling is simply dead, which is
  how the Settings screen became unscrollable on an iPhone.

  The reset is no longer emitted, and these rules state what this app needs
  outright rather than relying on its absence.
*/
html {
  height: auto;
}

body {
  height: auto;
  min-height: 100vh;
  /* Vertical must stay scrollable; horizontal stays clipped so a stray wide
     element can never produce a sideways scrollbar. */
  overflow-y: visible;
  overflow-x: hidden;
}

#root {
  width: 100%;
  flex: 1 0 auto;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/*
  Let the DOCUMENT scroll rather than a scroller nested inside the page. With a
  header and footer around the game, an inner scrollbar reads as broken and can
  strand the footer.
*/
#root > div {
  flex: 1 0 auto;
  height: auto;
  min-height: 0;
}

body {
  -webkit-tap-highlight-color: transparent;
  /*
    Stops the pull-to-refresh and rubber-band that would otherwise fire on a
    vertical swipe. The page still scrolls normally — 'touch-action: none' is
    scoped to the board itself (see Board.tsx), which is the only element that
    must keep the gesture. Applying it to the whole document would make a page
    that now has a header and footer impossible to scroll on a phone.
  */
  overscroll-behavior-y: contain;
}

/* Numbers should never be selectable mid-swipe, but keep the chrome selectable. */
#root {
  user-select: none;
  -webkit-user-select: none;
}

/*
  React Native Web stamps its own font-family onto every Text node, which would
  otherwise beat the inherited body font. Declaring it across the app subtree
  guarantees the brand face is used everywhere without having to thread a
  fontFamily through every style object. Components still set FONT_STACK
  themselves, which is what native will rely on in Phase 2.
*/
#root,
#root * {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}

/*
  Keyboard focus must stay visible on every theme.

  Using currentColor resolved to the inherited body colour on the focusable
  div — white — which is invisible on the Classic and Forest themes' cream
  backgrounds. A dark ring inside a white halo reads on any backdrop, light or
  dark, without needing to know the theme.
*/
:focus-visible {
  outline: 2px solid #101418;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9);
  border-radius: 9999px;
}
`;

export default function Root({ children }: { children: React.ReactNode }) {
  /**
   * The app is published under a sub-path (wing.cx/ships/2048), so links to
   * static files in `public/` cannot be written as absolute "/foo" — that would
   * resolve to the domain root. Expo rewrites bundled asset URLs using the
   * `experiments.baseUrl` from app.json and exposes it here; these hand-written
   * URLs have to apply it themselves.
   *
   * Site chrome assets are the opposite case: they genuinely do live at the
   * domain root, so they stay absolute.
   *
   * Only the export applies the prefix. The dev server serves `public/` from the
   * root and ignores baseUrl entirely, so applying it there pointed the font and
   * the manifest at URLs that 404.
   */
  const baseUrl =
    process.env.NODE_ENV === 'production' ? (process.env.EXPO_BASE_URL ?? '') : '';

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <title>2048 — Free and Ad-Free</title>
        <meta
          name="description"
          content="A free, ad-free, tracking-free 2048. Works offline. No accounts, no analytics, no third-party requests. Your data never leaves your device."
        />

        {/*
          Floor for the chrome, before site.css so the real stylesheet overrides
          it wherever it exists. Keeps the app presentable when served on its own.
        */}
        <style dangerouslySetInnerHTML={{ __html: fallbackChromeCss }} />

        {/* Site chrome — same-origin, so no third-party request is introduced. */}
        <link rel="stylesheet" href="/assets/site.css" />
        <script src="/assets/i18n.js" defer />
        <script src="/assets/site.js" defer />

        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/*
          The brand typeface, self-hosted. See the fontCss block above for why
          it is not linked from Google's CDN like the rest of the site.
          Preloading the latin subset avoids a flash of fallback text: it is the
          only font file virtually every visitor needs.
        */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href={`${baseUrl}/fonts/plus-jakarta-sans-latin.woff2`}
          crossOrigin="anonymous"
        />
        <style dangerouslySetInnerHTML={{ __html: fontCss(baseUrl) }} />

        {/* PWA */}
        <link rel="manifest" href={`${baseUrl}/manifest.json`} />
        <meta name="theme-color" content="#275973" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="2048" />

        <style dangerouslySetInnerHTML={{ __html: globalCss }} />

        <script
          dangerouslySetInnerHTML={{
            __html:
              process.env.NODE_ENV === 'production'
                ? `
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function () {
                      // Scope must be the app's own sub-path, or the worker
                      // would try to control the whole wing.cx origin.
                      navigator.serviceWorker
                        .register('${baseUrl}/sw.js', { scope: '${baseUrl}/' })
                        .catch(function () {
                          /* Offline support is a bonus; never block the game on it. */
                        });
                    });
                  }
                `
                : `
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function (rs) {
                      rs.forEach(function (r) { r.unregister(); });
                    });
                    if (window.caches && caches.keys) {
                      caches.keys().then(function (ks) {
                        ks.forEach(function (k) { caches.delete(k); });
                      });
                    }
                  }
                `,
          }}
        />
      </head>
      <body>
        {/* Lifted verbatim from the site's pages so the chrome stays identical. */}
        <header className="site-header">
          <a href="/" className="brand">
            wing.cx
          </a>

          <nav className="nav-pill-center">
            <a href="/ships" className="nav-item is-active" data-i18n="nav.ships">
              Ships
            </a>
            <a href="/signals" className="nav-item" data-i18n="nav.signals">
              Signals
            </a>
          </nav>

          <div className="nav-actions">
            <div
              className="lang-toggle"
              role="group"
              data-i18n-label="lang.label"
              aria-label="Language"
            >
              <button type="button" className="lang-opt" data-lang="en">
                EN
              </button>
              <button type="button" className="lang-opt" data-lang="es">
                ES
              </button>
            </div>
          </div>
        </header>

        {children}

        {/*
          Deliberately NOT a copy of the site's footer: the WhatsApp link is
          left out here. It carries a personal phone number in its href, and
          this page's source is a public repo whose build is also served from a
          second origin. Do not restore it for parity with the site.
        */}
        <footer className="site-footer">
          <span data-i18n="footer.copyright">© Daniel Wing</span>
          <a href="/">wing.cx</a>
          <a href="mailto:wing@wing.cx">wing@wing.cx</a>
          <a
            href="https://www.linkedin.com/in/daniel-wing"
            target="_blank"
            rel="noopener noreferrer"
            data-i18n="nav.linkedin"
          >
            LinkedIn
          </a>
        </footer>
      </body>
    </html>
  );
}
