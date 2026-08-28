/**
 * Which language the game should speak — WEB.
 *
 * The site already owns this decision: assets/site.js resolves the language
 * from ?lang=, then localStorage, then the browser's own preferences, exposes
 * it as window.WING_LANG, and dispatches `wing:languagechange` when the EN/ES
 * toggle is used. The game listens to that rather than growing a second
 * control, so one toggle moves the whole page.
 *
 * The resolution below duplicates site.js's order deliberately. The game has to
 * render before site.js has necessarily run, and it also has to work when
 * site.js is absent entirely — served from the dev server, or hosted anywhere
 * outside wing.cx.
 */

import { useEffect, useState } from 'react';

import { SUPPORTED, type Language } from './strings';

/** Same key site.js writes, so the two never disagree. */
const STORAGE_KEY = 'wing-lang';

function isSupported(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED as readonly string[]).includes(value);
}

function resolve(): Language {
  if (typeof window === 'undefined') return 'en';

  // Whatever site.js already settled on wins, so a shared ?lang= link and the
  // toggle agree with the chrome around the game.
  const declared = (window as { WING_LANG?: unknown }).WING_LANG;
  if (isSupported(declared)) return declared;

  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (isSupported(fromUrl)) return fromUrl;
  } catch {
    /* Malformed URL; fall through. */
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isSupported(stored)) return stored;
  } catch {
    /* Private mode. */
  }

  const tags = navigator.languages ?? [navigator.language];
  for (const tag of tags) {
    const code = String(tag || '').toLowerCase().split('-')[0];
    if (isSupported(code)) return code;
  }

  return 'en';
}

export function useLanguage(): Language {
  const [language, setLanguage] = useState<Language>(resolve);

  useEffect(() => {
    // site.js may finish resolving after this component first renders.
    setLanguage(resolve());

    const onChange = (event: Event) => {
      const next = (event as CustomEvent<{ lang?: unknown }>).detail?.lang;
      if (isSupported(next)) setLanguage(next);
    };

    document.addEventListener('wing:languagechange', onChange);
    return () => document.removeEventListener('wing:languagechange', onChange);
  }, []);

  return language;
}
