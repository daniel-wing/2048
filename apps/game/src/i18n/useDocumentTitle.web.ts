/**
 * Keeps the browser tab title in the current language — WEB.
 *
 * `<Head>` from expo-router is what puts a title into each prerendered file,
 * which is what crawlers and link previews read, and it stays for that reason.
 * But on this static export it does not touch the title at runtime: a loaded
 * page ends up with two <title> elements — the prerendered one and the shell's
 * — and the first wins. Both were written at export time, in English, so the
 * tab stayed English while the whole page rendered in Spanish.
 *
 * Setting it directly is the reliable half. Prerender keeps serving the SEO
 * title; this corrects it for the reader once the language is known, and again
 * whenever they use the toggle.
 */

import { useEffect } from 'react';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    if (!title || typeof document === 'undefined') return;
    document.title = title;
  }, [title]);
}
