/**
 * App tests run on the `jest-expo` preset — the same Jest runner the engine
 * uses, so there is only ever one test framework in this repo.
 *
 * The workspace-linked engine ships TypeScript source (no build step), so Metro
 * and Jest both need it transformed rather than treated as an opaque dependency.
 */
module.exports = {
  preset: 'jest-expo',
  /*
    NOTE: the platform split resolves to the `.native` file here, because
    jest-expo's preset is built around the native runtime and forcing web
    resolution (via moduleFileExtensions or haste.defaultPlatform) breaks its
    own global setup.

    That is fine for the store tests, which only need *a* storage backend and
    get an isolated in-memory one.

    KNOWN GAP: the web adapter's own guards — the private-mode probe and the
    quota fallback — have no unit test, because a test importing `.web.ts`
    directly needs a jsdom environment this preset will not load. That path is
    covered in the browser instead: run scripts/serve-site.py, write a corrupt
    value to localStorage, reload, and confirm the game recovers.
  */
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@2048/engine))',
  ],
};
