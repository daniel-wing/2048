/**
 * Babel configuration.
 *
 * ⚠️ Reanimated's worklet plugin — read before changing this file.
 *
 * The plan called for adding 'react-native-reanimated/plugin' here by hand.
 * That instruction is correct for Reanimated 2/3, but STALE for this stack:
 *
 *   - Expo SDK 57 ships Reanimated 4, whose Babel plugin was renamed to
 *     'react-native-worklets/plugin' (it moved into the react-native-worklets
 *     package). The old path is not the right one to reference here.
 *   - `babel-preset-expo` adds that worklets plugin AUTOMATICALLY as soon as
 *     react-native-reanimated is installed. Expo's SDK 57 docs say verbatim:
 *     "No additional configuration is required."
 *
 * So the plan's GOAL (worklets are transformed, M3 animations don't crash) is
 * met by the preset. Adding the plugin by hand here would either reference a
 * non-existent path or double-register it — both worse than leaving it alone.
 *
 * If you ever do need it explicitly (e.g. dropping Expo's preset), the correct
 * entry is 'react-native-worklets/plugin' and it MUST be last in `plugins`.
 *
 * After editing this file, restart with `npx expo start -c`.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Intentionally empty: babel-preset-expo injects the worklets plugin.
    plugins: [],
  };
};
