/**
 * Metro configuration for the monorepo.
 *
 * Metro does not follow workspace links out of the app directory on its own, so
 * without this the very first `import { ... } from '@2048/engine'` fails with an
 * unresolved-module error. Two settings fix it:
 *
 *  - watchFolders        lets Metro see (and hot-reload) packages/engine
 *  - resolver.nodeModulesPaths  resolves deps from the app AND the hoisted root
 *
 * After editing this file, restart with `npx expo start -c` — Metro caches
 * aggressively and will otherwise keep serving the old config.
 */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the whole workspace so packages/engine is visible to the bundler.
config.watchFolders = [workspaceRoot];

// Resolve modules from both the app's node_modules and the workspace root's.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
