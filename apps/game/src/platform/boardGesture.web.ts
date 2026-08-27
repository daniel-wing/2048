/**
 * Styles the board needs to own the swipe — WEB.
 *
 * `touchAction: 'none'` is load-bearing: without it mobile browsers take
 * vertical swipes for pull-to-refresh and horizontal ones for back-navigation,
 * which makes the game unplayable in a phone browser. It is also React Native
 * Web only, which is why it lives behind a platform split rather than inline in
 * the shared component.
 */

import type { ViewStyle } from 'react-native';

export const boardGestureStyle = {
  touchAction: 'none',
  userSelect: 'none',
} as ViewStyle;
