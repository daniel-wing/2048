#!/usr/bin/env node
/**
 * Builds the deployable tree for this repo's own Vercel project.
 *
 * The export is served at `/ships/2048/` rather than at the root, and that is
 * deliberate: it is the URL the game has always had, and wing.cx now reaches it
 * by proxying that same path through. Keeping `baseUrl` as it was means every
 * emitted asset URL, the service worker scope and any link already indexed all
 * stay exactly as they were when the build lived inside the site repo. A move
 * to the root would have been tidier here and broken all four.
 *
 * So `expo export` writes a flat `dist/` whose URLs carry the prefix, and this
 * relocates that tree to where those URLs actually resolve.
 */

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const exportDir = join(repoRoot, 'apps', 'game', 'dist');
const outputRoot = join(repoRoot, 'build');

/** Must match `experiments.baseUrl` in apps/game/app.json. */
const BASE_PATH = join('ships', '2048');

function run(command, args) {
  execFileSync(command, args, { cwd: repoRoot, stdio: 'inherit' });
}

run('npm', ['run', 'build:web']);

if (!existsSync(exportDir)) {
  console.error(`error: expected an export at ${exportDir}`);
  process.exit(1);
}

rmSync(outputRoot, { recursive: true, force: true });
const destination = join(outputRoot, BASE_PATH);
mkdirSync(dirname(destination), { recursive: true });
cpSync(exportDir, destination, { recursive: true });

/*
  expo-router emits a route listing of every screen in the app. It is a
  development aid, and `robots.txt` is `Allow: /`, so shipping it publishes a
  crawlable index of internal routes for no benefit. It used to be deleted by
  hand after every build, which is exactly the kind of step that gets forgotten
  once.
*/
rmSync(join(destination, '_sitemap.html'), { force: true });

/*
  Two origins now serve these exact bytes: this deployment, and wing.cx, which
  reaches it through a rewrite. Only the wing.cx path is canonical, so letting
  this one be crawled would publish a duplicate of every page.

  This robots.txt sits at THIS origin's root and governs only this origin —
  wing.cx serves its own from its own root, and that one still allows the
  canonical path through.
*/
writeFileSync(
  join(outputRoot, 'robots.txt'),
  [
    '# This origin is an implementation detail.',
    '# The game lives at https://wing.cx/ships/2048/, which rewrites to here.',
    '# Crawling this copy would duplicate every page under a URL nobody should land on.',
    'User-agent: *',
    'Disallow: /',
    '',
  ].join('\n'),
);

console.log(`built  ${outputRoot}/`);
console.log(`served at /${BASE_PATH.split(/[\\/]/).join('/')}/`);
