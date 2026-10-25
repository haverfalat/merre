import {
  BusFront,
  CableCar,
  Footprints,
  MapPin,
  Plane,
  Ship,
  TrainFront,
  TrainFrontTunnel,
  TramFront,
} from 'lucide-react-native';
import { useTheme } from '~/lib/theme';

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
  const Icon =
    mode === 'RAIL' || mode === 'SUBURBAN_RAILWAY' || mode === 'FUNICULAR'
      ? TrainFront
      : mode === 'SUBWAY'
        ? TrainFrontTunnel
        : mode === 'TRAM' || mode === 'TRAMTRAIN'
          ? TramFront
          : mode === 'FERRY'
            ? Ship
            : mode === 'WALK'
              ? Footprints
              : mode === 'AIRPLANE'
                ? Plane
                : mode === 'CABLE_CAR' || mode === 'GONDOLA'
                  ? CableCar
                  : mode === 'BUS' ||
                      mode === 'COACH' ||
                      mode === 'TROLLEYBUS' ||
                      mode === 'RAIL_REPLACEMENT_BUS'
                    ? BusFront
                    : MapPin;
  return <Icon size={size} color={color || c.secondary} />;
}
