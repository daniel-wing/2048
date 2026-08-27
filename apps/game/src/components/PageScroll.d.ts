/**
 * Shared type surface for the platform-split `PageScroll`.
 *
 * Metro resolves the runtime file (`.web.tsx` or `.native.tsx`); TypeScript
 * resolves this declaration, so the two implementations cannot drift apart.
 */

import type React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type PageScrollProps = {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export declare function PageScroll(props: PageScrollProps): React.JSX.Element;
