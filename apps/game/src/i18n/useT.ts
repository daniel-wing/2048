/**
 * The translate function, bound to the language currently in effect.
 *
 * Platform-agnostic on purpose: `useLanguage` is the only piece that knows
 * where the choice comes from (the site's toggle on web, the device locale on
 * native), so every screen can just call `t('some.key')` and stay portable.
 */

import { useCallback } from 'react';

import { useLanguage } from './useLanguage';
import { translate, type Language, type StringKey } from './strings';

export type Translate = (key: StringKey, vars?: Record<string, string | number>) => string;

export function useT(): Translate {
  const language = useLanguage();
  return useCallback<Translate>((key, vars) => translate(language, key, vars), [language]);
}

/** Occasionally a caller needs the raw code — number formatting, mostly. */
export function useLocale(): Language {
  return useLanguage();
}
