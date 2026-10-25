import { destinationBoarding } from '@/lib/boarding';
import type { Departure } from '@/lib/stop-departures';
import { getRouteColor } from '@/lib/transit/colors';
import { cleanTransitLabel } from '@/lib/transit/labels';
import { isRailMode } from '@/lib/transit/modes';
import type { StopDetail, Stoptime } from '@/lib/transit/types/stop';

export type BoardDirection = 'departures' | 'arrivals';

/** Arrival and departure estimates can differ, including at a terminating station. */
export function boardTiming(time: Stoptime, direction: BoardDirection) {
  const scheduled = direction === 'arrivals' ? time.scheduledArrival : time.scheduledDeparture;
  const estimated = direction === 'arrivals' ? time.realtimeArrival : time.realtimeDeparture;
  const live = time.realtime === true && estimated != null;
  const seconds = live ? estimated : scheduled;
  const delay = live
    ? ((direction === 'arrivals' ? time.arrivalDelay : time.departureDelay) ??
      (scheduled != null ? estimated - scheduled : null))
    : null;
  return {
    live,
    seconds,
    delay,
    epoch: time.serviceDay != null && seconds != null ? time.serviceDay + seconds : null,
  };
}

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
      const scheduled = direction === 'arrivals' ? time.scheduledArrival : time.scheduledDeparture;
      const key = `${time.trip?.gtfsId || time.trip?.id || routeId}|${time.serviceDay}|${scheduled ?? boardTiming(time, direction).seconds}|${time.stop?.id || time.stop?.gtfsId || ''}`;
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
