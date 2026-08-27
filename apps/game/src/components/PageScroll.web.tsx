/**
 * Page container — WEB.
 *
 * On the web the game is embedded in a wing.cx page that has its own header and
 * footer, and the DOCUMENT is what scrolls. Rendering a ScrollView here would
 * create a scroller inside the page: long screens like Settings would scroll
 * within a fixed-height box, clipping their last card and stranding the footer
 * against the cut edge.
 *
 * So the web build is a plain View that grows to its content, and the browser
 * handles scrolling. The native twin keeps the real ScrollView, because there
 * the app IS the whole screen.
 *
 * Split by file extension rather than a runtime check, for the same reason as
 * useKeyboard: the wrong implementation should never reach the other platform.
 */

import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

export type PageScrollProps = {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function PageScroll({ style, contentContainerStyle, children }: PageScrollProps) {
  // The ScrollView's two style props collapse into one on a plain View.
  return <View style={[style, contentContainerStyle]}>{children}</View>;
}
