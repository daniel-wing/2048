#!/usr/bin/env node
/**
 * Contrast audit for every colour pairing the app can show.
 *
 * Exists because contrast is the one design property that cannot be judged by
 * eye — the default theme looked fine and was failing at 2.99:1. Run it after
 * any palette change:
 *
 *     node scripts/check-contrast.mjs
 *
 * Exits non-zero if anything fails, so it can gate a release.
 *
 * Thresholds are WCAG 2.1 AA: 4.5:1 for body text, 3:1 for large text (>=18.66px
 * bold or >=24px) and for the tile numerals, which are always large and bold.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const PALETTES = join(HERE, '..', 'apps', 'game', 'src', 'theme', 'palettes.ts');

const AA_NORMAL = 4.5;
const AA_LARGE = 3.0;

/** sRGB hex (or rgba over a known backdrop) to relative luminance. */
function luminance(rgb) {
  const channel = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

function ratio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

function parseHex(hex) {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

/** Composite `rgba(r,g,b,a)` over an opaque backdrop, which is what the eye sees. */
function parseColor(value, backdrop) {
  const text = String(value).trim();
  if (text.startsWith('#')) return parseHex(text);

  const rgba = text.match(/rgba?\(([^)]+)\)/);
  if (rgba) {
    const parts = rgba[1].split(',').map((p) => parseFloat(p.trim()));
    const [r, g, b] = parts;
    const alpha = parts.length > 3 ? parts[3] : 1;
    if (alpha >= 1) return [r, g, b];
    if (!backdrop) return null; // Cannot judge translucency without a backdrop.
    return [0, 1, 2].map((i) => Math.round(alpha * [r, g, b][i] + (1 - alpha) * backdrop[i]));
  }
  return null;
}

/** Pull the palette data out of the TS source without needing a build step. */
function loadThemes() {
  const src = readFileSync(PALETTES, 'utf8');
  const themes = [];

  for (const match of src.matchAll(/const (\w+): Theme = \{([\s\S]*?)\n\};/g)) {
    const [, name, body] = match;

    const colors = {};
    const colorBlock = body.match(/colors: \{([\s\S]*?)\n  \},/);
    if (colorBlock) {
      for (const c of colorBlock[1].matchAll(/(\w+):\s*'([^']+)'/g)) colors[c[1]] = c[2];
    }

    const fallbackBg = (body.match(/backgroundFallback:\s*'([^']+)'/) || [])[1];

    const tiles = [];
    const tileBlock = body.match(/tiles: \{([\s\S]*?)\n  \},/);
    if (tileBlock) {
      for (const t of tileBlock[1].matchAll(/(\d+):\s*\{ bg: '([^']+)', fg: '([^']+)' \}/g)) {
        tiles.push({ value: Number(t[1]), bg: t[2], fg: t[3] });
      }
    }
    const fb = body.match(/fallbackTile:\s*\{ bg: '([^']+)', fg: '([^']+)' \}/);
    if (fb) tiles.push({ value: 'above 2048', bg: fb[1], fg: fb[2] });

    themes.push({ name, colors, tiles, fallbackBg });
  }
  return themes;
}

const failures = [];
const checks = [];

function check(label, fgRaw, bgRaw, threshold, backdrop) {
  const bg = parseColor(bgRaw, backdrop);
  const fg = parseColor(fgRaw, bg ?? backdrop);
  if (!fg || !bg) return;
  const r = ratio(fg, bg);
  const row = { label, fg: fgRaw, bg: bgRaw, ratio: r, threshold, pass: r >= threshold };
  checks.push(row);
  if (!row.pass) failures.push(row);
}

for (const theme of loadThemes()) {
  // The Wing theme is transparent over the page gradient; everything else
  // paints its own background.
  const surfaceBase =
    theme.colors.background === 'transparent' ? theme.fallbackBg : theme.colors.background;
  const base = parseColor(surfaceBase);

  check(`${theme.name}: text on background`, theme.colors.text, surfaceBase, AA_NORMAL, base);
  check(`${theme.name}: muted text on background`, theme.colors.textMuted, surfaceBase, AA_NORMAL, base);
  check(`${theme.name}: score pill`, theme.colors.scoreText, theme.colors.scoreBg, AA_NORMAL, base);
  check(`${theme.name}: primary button`, theme.colors.accentText, theme.colors.accent, AA_NORMAL, base);

  for (const tile of theme.tiles) {
    check(`${theme.name}: tile ${tile.value}`, tile.fg, tile.bg, AA_LARGE, base);
  }
}

const width = Math.max(...checks.map((c) => c.label.length));
for (const c of checks) {
  const mark = c.pass ? '  ok ' : 'FAIL ';
  console.log(
    `${mark} ${c.label.padEnd(width)}  ${c.ratio.toFixed(2).padStart(5)}:1  (needs ${c.threshold})`,
  );
}

console.log(`\n${checks.length - failures.length}/${checks.length} pass`);

if (failures.length) {
  console.error(`\n${failures.length} failing pairing(s):`);
  for (const f of failures) {
    console.error(`  ${f.label}: ${f.fg} on ${f.bg} is ${f.ratio.toFixed(2)}:1, needs ${f.threshold}`);
  }
  process.exit(1);
}
