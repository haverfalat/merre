import { destinationBoarding } from '@/lib/boarding';
import type { Departure } from '@/lib/stop-departures';
import { getRouteColor } from '@/lib/transit/colors';
import { cleanTransitLabel } from '@/lib/transit/labels';
import { isRailMode } from '@/lib/transit/modes';
import { stopTimeKey, stopTiming as boardTiming, type StopTimeDirection } from '@/lib/transit/stop-times';
import type { StopDetail } from '@/lib/transit/types/stop';

export { boardTiming };
export type BoardDirection = StopTimeDirection;

export function hasRailBoard(stop: StopDetail | null | undefined) {
  return !!(
    stop?.routes?.some((route) => isRailMode(route.mode)) ||
    stop?.stopTimes?.some((group) => isRailMode(group.pattern?.route?.mode))
  );
}

export function stopBoardRows(
  stop: StopDetail | null | undefined,
  direction: BoardDirection,
  unknownOrigin = '',
): Departure[] {
  const rows: Departure[] = [];
  const seen = new Set<string>();
  for (const group of stop?.stopTimes ?? []) {
    const route = group.pattern?.route;
    if (direction === 'arrivals' && !isRailMode(route?.mode)) continue;
    for (const time of group.times ?? []) {
      if (
        (direction === 'arrivals' ? time.dropoffType : time.pickupType) === 'NONE' ||
        boardTiming(time, direction).epoch == null
      )
        continue;
      const origin = group.pattern?.fromStopName || time.trip?.stops?.[0]?.name || unknownOrigin;
      const destination = destinationBoarding(
        direction === 'arrivals'
          ? origin
          : time.headsign || time.trip?.tripHeadsign || group.pattern?.headsign || '',
      );
      const routeLabel = route?.shortName || time.trip?.tripShortName || '?';
      const routeId =
        route?.gtfsId || route?.id || `${route?.mode}|${cleanTransitLabel(routeLabel)}`;
      const key = `${routeId}|${stopTimeKey(time)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        ...time,
        routeLabel,
        routeId,
        routeKey: `${routeId}|${destination.destinationKey}`,
        headsign: destination.headsign,
        frontDoor:
          direction === 'departures' &&
          [time.headsign, time.trip?.tripHeadsign, group.pattern?.headsign].some(
            (headsign) => destinationBoarding(headsign || '').frontDoor,
          ),
        mode: route?.mode ?? undefined,
        color: getRouteColor(route?.mode, route?.color, route?.textColor).primary,
      });
    }
  }
  return rows.sort((a, b) => boardTiming(a, direction).epoch! - boardTiming(b, direction).epoch!);
}
