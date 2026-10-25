import type { GroupedChildStop, StopDetail, StopRoutesResponse } from './transit/types/stop';
import type { StopConnectionsResponse } from '@/lib/transit/types/connections';
import { cleanTransitPlaceName } from '@/lib/transit/labels';
import type { BoardingStop } from './boarding-stops';

export function stopNameKey(value: string) {
  return cleanTransitPlaceName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function samePlaceStops(stops: GroupedChildStop[], name: string) {
  const key = stopNameKey(name);
  return stops.filter((stop) => key && stopNameKey(stop.name || '') === key);
}

function mergeRoutes<R extends { id: string; patterns?: { id: string | null }[] | null }>(
  routes: R[],
): R[] {
  const result = new Map<string, R>();
  for (const route of routes) {
    const previous = result.get(route.id);
    result.set(
      route.id,
      previous
        ? {
            ...previous,
            patterns: [
              ...new Map(
                [...(previous.patterns ?? []), ...(route.patterns ?? [])].map((pattern) => [
                  pattern.id,
                  pattern,
                ]),
              ).values(),
            ],
          }
        : route,
    );
  }
  return [...result.values()];
}

export function mergeStopDetails(stops: StopDetail[]) {
  if (!stops.length) return undefined;
  return {
    ...stops[0],
    groupedStops: stops,
    routes: [
      ...new Map(
        stops.flatMap((stop) => stop.routes ?? []).map((route) => [route.id, route]),
      ).values(),
    ],
    stopTimes: stops.flatMap((stop) => stop.stopTimes ?? []),
    alerts: [
      ...new Map(
        stops
          .flatMap((stop) => stop.alerts ?? [])
          .map((alert) => [alert.id || alert.alertHash || JSON.stringify(alert), alert]),
      ).values(),
    ],
  };
}

function boardingOrigins(stops: (BoardingStop & { boardingStops?: BoardingStop[] })[]) {
  return stops.flatMap(
    (stop) => stop.boardingStops ?? [{ id: stop.id, parentStation: stop.parentStation }],
  );
}

export function mergeStopRoutes(stops: StopRoutesResponse[]) {
  return stops.length
    ? {
        ...stops[0],
        boardingStops: boardingOrigins(stops),
        routes: mergeRoutes(stops.flatMap((stop) => stop.routes)),
      }
    : undefined;
}

export function mergeStopConnections(stops: StopConnectionsResponse[]) {
  return stops.length
    ? {
        ...stops[0],
        boardingStops: boardingOrigins(stops),
        routes: mergeRoutes(stops.flatMap((stop) => stop.routes)),
      }
    : undefined;
}
