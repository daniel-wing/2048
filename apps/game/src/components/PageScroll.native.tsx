/**
 * Page container — NATIVE.
 *
 * On iOS and Android the app owns the whole screen, so a real ScrollView is
 * exactly right. Signature must stay identical to PageScroll.web.tsx.
 */

import React from 'react';
import { ScrollView, type StyleProp, type ViewStyle } from 'react-native';

export type PageScrollProps = {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function PageScroll({ style, contentContainerStyle, children }: PageScrollProps) {
  return (
    <ScrollView style={style} contentContainerStyle={contentContainerStyle}>
      {children}
    </ScrollView>
  );
}
