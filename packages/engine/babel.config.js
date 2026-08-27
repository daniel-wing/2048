/**
 * Used by babel-jest when running the engine's tests. The app has its own
 * babel.config.js (with the Reanimated plugin); this one only needs to strip
 * types and target the running node version.
 */
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
};
