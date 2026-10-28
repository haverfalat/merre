import { contrastTextColor, getRouteColor } from '@/lib/transit/colors';
import type { ReactNode } from 'react';
import { Image, View } from 'react-native';
import { ModeIcon } from './ModeIcon';

const bkkIcons: Record<string, number> = {
  BUS: require('../../../../assets/bkk/bus.png'),
  TROLLEYBUS: require('../../../../assets/bkk/trolleybus.png'),
  TRAM: require('../../../../assets/bkk/tram.png'),
  SUBWAY: require('../../../../assets/bkk/subway.png'),
  SUBURBAN_RAILWAY: require('../../../../assets/bkk/suburban-railway.png'),
  FERRY: require('../../../../assets/bkk/ferry.png'),
};

export function ModeCircle({
  mode,
  color,
  size = 23,
  iconSize = 14,
  overlay,
  outline,
  bkk = false,
}: {
  mode?: string | null;
  color?: string | null;
  size?: number;
  iconSize?: number;
  overlay?: ReactNode;
  outline?: string;
  bkk?: boolean;
}) {
  const bkkIcon = bkk && mode ? bkkIcons[mode] : undefined;
  const backgroundColor = getRouteColor(mode, color).primary;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bkkIcon ? 'transparent' : backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        borderWidth: outline ? 2 : 0,
        borderColor: outline,
      }}
    >
      {bkkIcon ? (
        <Image source={bkkIcon} style={{ width: size, height: size }} resizeMode="contain" />
      ) : (
        <ModeIcon mode={mode} size={iconSize} color={contrastTextColor(backgroundColor)} />
      )}
      {overlay && <View style={{ position: 'absolute', right: -3, bottom: -2 }}>{overlay}</View>}
    </View>
  );
}
