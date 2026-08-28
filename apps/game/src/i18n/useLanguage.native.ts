/**
 * Which language the game should speak — NATIVE.
 *
 * There is no site chrome and no EN/ES toggle here, so the device's own
 * preference is the only signal. Phase 2 should add an explicit override in
 * Settings, since a device set to English is not the same as a person who
 * wants to read English.
 */

import { SUPPORTED, type Language } from './strings';

function deviceLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const code = String(locale || '').toLowerCase().split('-')[0];
    if ((SUPPORTED as readonly string[]).includes(code)) return code as Language;
  } catch {
    /* No Intl data; fall through. */
  }
  return 'en';
}

const resolved = deviceLanguage();

export function useLanguage(): Language {
  // Fixed for the lifetime of the process: changing the system language
  // restarts the app on both platforms.
  return resolved;
}
