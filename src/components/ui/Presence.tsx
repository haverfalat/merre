import Animated from 'react-native-reanimated';
import type { PresenceProps } from './Presence.types';

export function Presence({ visible, preset, ...props }: PresenceProps) {
  void preset;
  return visible ? <Animated.View {...props} /> : null;
}
