import type { GroupedChildStop } from './transit/types/stop';
import { getTransitColor, normalizeHexColor } from '@/lib/transit/colors';

export function transportSymbol(mode?: string | null) {
  switch (mode?.toUpperCase()) {
    case 'RAIL':
      return 'rail';
    case 'SUBURBAN_RAILWAY':
      return 'suburban-railway';
    case 'TRAM':
    case 'TRAMTRAIN':
      return 'tram';
    case 'SUBWAY':
      return 'subway';
    case 'BUS':
    case 'COACH':
    case 'RAIL_REPLACEMENT_BUS':
      return 'bus';
    case 'TROLLEYBUS':
      return 'trolleybus';
    case 'FERRY':
      return 'ferry';
    case 'CABLE_CAR':
    case 'GONDOLA':
      return 'cable';
    case 'FUNICULAR':
      return 'rail';
    case 'AIRPLANE':
      return 'plane';
    case 'WALK':
      return 'walk';
    default:
      return 'stop';
  }
}

export function stopAppearance(stop: GroupedChildStop) {
  const routes = stop.routes ?? [];
  const colors = [
    ...new Set(
      routes.map(
        (route) =>
          normalizeHexColor(route.color) ??
          normalizeHexColor(route.textColor) ??
          getTransitColor(route.mode ?? undefined).primary,
      ),
    ),
  ].sort();
  const symbols = [...new Set(routes.map((route) => transportSymbol(route.mode)))];
  return {
    colors: colors.length ? colors : ['#64748b'],
    bearing:
      typeof stop.bearing === 'number' && Number.isFinite(stop.bearing)
        ? ((stop.bearing % 360) + 360) % 360
        : null,
    // An interchange must not falsely advertise just one of its transport modes.
    icon: symbols.length === 1 ? symbols[0] : 'stop',
  };
}
