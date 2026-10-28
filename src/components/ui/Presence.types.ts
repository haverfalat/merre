import type { ComponentProps } from 'react';
import type { ViewProps } from 'react-native';
import type Animated from 'react-native-reanimated';

export type PresenceProps = ViewProps & {
  visible: boolean;
  preset?: 'fade' | 'sheet' | 'popup' | 'dropdown';
  entering?: ComponentProps<typeof Animated.View>['entering'];
  exiting?: ComponentProps<typeof Animated.View>['exiting'];
};
