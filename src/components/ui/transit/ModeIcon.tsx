import {
  CableCar,
  Footprints,
  MapPin,
  Plane,
  TrainFront,
} from 'lucide-react-native';
import { Image } from 'react-native';
import { useTheme } from '~/lib/theme';

// Local masks of the original BKK pictograms keep existing theme and route colors.
const symbols: Record<string, number> = {
  BUS: require('../../../../assets/bkk/bus-symbol.png'),
  COACH: require('../../../../assets/bkk/bus-symbol.png'),
  RAIL_REPLACEMENT_BUS: require('../../../../assets/bkk/bus-symbol.png'),
  TROLLEYBUS: require('../../../../assets/bkk/trolleybus-symbol.png'),
  TRAM: require('../../../../assets/bkk/tram-symbol.png'),
  TRAMTRAIN: require('../../../../assets/bkk/tram-symbol.png'),
  SUBWAY: require('../../../../assets/bkk/subway-symbol.png'),
  SUBURBAN_RAILWAY: require('../../../../assets/bkk/suburban-railway-symbol.png'),
  FERRY: require('../../../../assets/bkk/ferry-symbol.png'),
};

export function ModeIcon({
  mode,
  color,
  size = 18,
}: {
  mode?: string | null;
  color?: string;
  size?: number;
}) {
  const c = useTheme();
  const source = mode ? symbols[mode] : undefined;
  if (source) {
    return <Image source={source} resizeMode="contain" accessible={false}
      style={{ width: size, height: size, tintColor: color || c.secondary, flexShrink: 0 }} />;
  }
  const Icon =
    mode === 'RAIL' || mode === 'FUNICULAR'
      ? TrainFront
      : mode === 'WALK'
        ? Footprints
        : mode === 'AIRPLANE'
          ? Plane
          : mode === 'CABLE_CAR' || mode === 'GONDOLA'
            ? CableCar
            : MapPin;
  return <Icon size={size} color={color || c.secondary} />;
}
