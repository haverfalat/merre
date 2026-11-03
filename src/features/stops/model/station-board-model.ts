import { stopHasFrontDoorBoarding } from '@/lib/boarding-policy';
import { destinationBoarding } from '@/lib/boarding';
import type { Departure } from '@/lib/stop-departures';
import { getRouteColor } from '@/lib/transit/colors';
import { cleanTransitLabel } from '@/lib/transit/labels';
import { isRailMode } from '@/lib/transit/modes';
import { stopTimeKey, stopTiming, type StopTimeDirection } from '@/lib/transit/stop-times';
import type { StopDetail, Stoptime } from '@/lib/transit/types/stop';

export type BoardDirection = StopTimeDirection;

export function boardTiming(time: Stoptime & { boardDirection?: BoardDirection }, direction: BoardDirection) {
  return stopTiming(time, time.boardDirection ?? direction);
}

export function hasRailBoard(stop: StopDetail | null | undefined) {
  return !!(
    stop?.routes?.some((route) => isRailMode(route.mode)) ||
    stop?.stopTimes?.some((group) => isRailMode(group.pattern?.route?.mode))
  );
}

export function stopBoardRows(
  stop: StopDetail | null | undefined,
  direction: BoardDirection | 'combined',
  unknownOrigin = '',
): Departure[] {
  const rows: Departure[] = [];
  const seen = new Set<string>();
  for (const group of stop?.stopTimes ?? []) {
    const route = group.pattern?.route;
    for (const time of group.times ?? []) {
      const event = direction === 'combined'
        ? time.pickupType !== 'NONE' && stopTiming(time, 'departures').epoch != null
          ? 'departures'
          : 'arrivals'
        : direction;
      if (
        (event === 'arrivals' ? time.dropoffType : time.pickupType) === 'NONE' ||
        stopTiming(time, event).epoch == null
      )
        continue;
      const origin = group.pattern?.fromStopName || time.trip?.stops?.[0]?.name || unknownOrigin;
      const destination = destinationBoarding(
        event === 'arrivals'
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
        boardDirection: event,
        routeLabel,
        routeId,
        routeKey: `${routeId}|${destination.destinationKey}`,
        headsign: destination.headsign,
        frontDoor: event === 'departures' && stopHasFrontDoorBoarding(time),
        mode: route?.mode ?? undefined,
        color: getRouteColor(route?.mode, route?.color, route?.textColor).primary,
      });
    }
  }
  return rows.sort((a, b) => boardTiming(a, 'departures').epoch! - boardTiming(b, 'departures').epoch!);
}
