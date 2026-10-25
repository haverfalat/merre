import { contrastTextColor, getRouteColor } from '@/lib/transit/colors';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ModeIcon } from './ModeIcon';

export function ModeCircle({
  mode,
  color,
  size = 23,
  iconSize = 14,
  overlay,
  outline,
}: {
  mode?: string | null;
  color?: string | null;
  size?: number;
  iconSize?: number;
  overlay?: ReactNode;
  outline?: string;
}) {
  const backgroundColor = getRouteColor(mode, color).primary;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        borderWidth: outline ? 2 : 0,
        borderColor: outline,
      }}
    >
      <ModeIcon mode={mode} size={iconSize} color={contrastTextColor(backgroundColor)} />
      {overlay && <View style={{ position: 'absolute', right: -3, bottom: -2 }}>{overlay}</View>}
    </View>
  );
}
