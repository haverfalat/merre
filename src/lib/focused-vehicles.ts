import type { RouteDetail } from './transit/types/route';
import type { StopRoutesResponse } from './transit/types/stop';
import type { RouteVehiclePositions, VehiclePosition } from './transit/types/vehicle';
import { validCoordinates } from './transit';
import { findBoardingStop } from './boarding-stops';

type VehicleRoute = NonNullable<VehiclePosition['trip']>['route'];

function normalize(position: RouteVehiclePositions, route: VehicleRoute): VehiclePosition {
  const full = position as Partial<VehiclePosition>;
  return {
    ...position,
    vehicleModel: full.vehicleModel ?? null,
    isEstimated: full.isEstimated ?? null,
    nextStop: position.nextStop ?? null,
    prevOrCurrentStop: position.prevOrCurrentStop ?? null,
    trip: position.trip
      ? {
          ...position.trip,
          route,
          routeShortName: position.trip.routeShortName ?? route?.shortName ?? null,
          pattern: position.trip.pattern ?? null,
        }
      : null,
  };
}

function unique(positions: VehiclePosition[]) {
  const vehicles = new Map<string, VehiclePosition>();
  for (const position of positions) {
    if (!validCoordinates(position.lon, position.lat)) continue;
    const tripId = position.trip?.gtfsId || position.trip?.id;
    if (!position.vehicleId && !tripId) continue;
    const key = position.vehicleId || `${tripId}|${position.trip?.serviceDate ?? ''}`;
    const previous = vehicles.get(key);
    if (!previous || (position.lastUpdated ?? 0) > (previous.lastUpdated ?? 0))
      vehicles.set(key, position);
  }
  return [...vehicles.values()];
}

function routeMetadata(
  route: Pick<RouteDetail, 'id' | 'mode' | 'shortName' | 'longName' | 'color' | 'textColor'>,
): VehicleRoute {
  return {
    id: route.id,
    mode: route.mode ?? null,
    shortName: route.shortName ?? null,
    longName: route.longName ?? null,
    color: route.color ?? null,
    textColor: route.textColor ?? null,
  };
}

export function vehiclesForRoute(route: RouteDetail | null | undefined) {
  if (!route) return [];
  return unique(
    (route.patterns ?? []).flatMap((pattern) =>
      (pattern.vehiclePositions ?? []).map((position) => normalize(position, routeMetadata(route))),
    ),
  );
}

export function vehiclesForStop(
  stop: StopRoutesResponse | null | undefined,
  stopId: string | string[],
  routeIds: string[] | null = null,
) {
  const ids = Array.isArray(stopId) ? stopId : [stopId];
  return unique(
    (stop?.routes ?? [])
      .filter((route) => routeIds === null || routeIds.includes(route.id))
      .flatMap((route) =>
        (route.patterns ?? [])
          .filter(
            (pattern) =>
              !!findBoardingStop(
                pattern.stops ?? [],
                ids,
                stop?.boardingStops ?? (stop ? [stop] : []),
              ),
          )
          .flatMap((pattern) =>
            (pattern.vehiclePositions ?? []).map((position) =>
              normalize(position, routeMetadata(route)),
            ),
          ),
      ),
  );
}
