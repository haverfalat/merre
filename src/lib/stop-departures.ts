import type { Stoptime, StopDetail } from './transit/types/stop';
import { destinationBoarding } from './boarding';
import { cleanTransitLabel } from '@/lib/transit/labels';
import { getRouteColor } from '@/lib/transit/colors';

export interface Departure extends Stoptime {
  routeLabel: string;
  routeKey: string;
  routeId: string;
  headsign: string;
  mode?: string;
  color: string;
  frontDoor: boolean;
}
export function departureEpoch(departure: Stoptime) {
  const seconds = departure.realtimeDeparture ?? departure.scheduledDeparture;
  return departure.serviceDay != null && seconds != null ? departure.serviceDay + seconds : null;
}

export function stopDepartures(stop: StopDetail | null | undefined): Departure[] {
  const seen = new Set<string>();
  const rows: Departure[] = [];
  for (const group of stop?.stopTimes ?? []) {
    const route = group.pattern?.route;
    for (const time of group.times ?? []) {
      if (departureEpoch(time) == null) continue;
      const { headsign, frontDoor, destinationKey } = destinationBoarding(
        time.headsign || time.trip?.tripHeadsign || group.pattern?.headsign || '',
      );
      const routeLabel = route?.shortName || time.trip?.tripShortName || '?';
      const routeId =
        route?.gtfsId || route?.id || `${route?.mode}|${cleanTransitLabel(routeLabel)}`;
      const key = `${time.trip?.gtfsId || time.trip?.id || routeId}|${time.serviceDay}|${time.scheduledDeparture ?? time.realtimeDeparture}|${time.stop?.id || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        ...time,
        routeLabel,
        headsign,
        frontDoor,
        routeId,
        routeKey: `${routeId}|${destinationKey}`,
        mode: route?.mode ?? undefined,
        color: getRouteColor(route?.mode, route?.color, route?.textColor).primary,
      });
    }
  }
  return rows.sort((a, b) => departureEpoch(a)! - departureEpoch(b)!);
}
