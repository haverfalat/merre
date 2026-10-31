import { decodePolyline } from '../../../mavplusz/src/utils/polyline';
import type * as Provider from '../../../mavplusz/types';
import { validCoordinates } from '../../../transit';
import type { DecodedTripDetail } from '../../client';
import type { StopConnectionsResponse } from '../../types/connections';
import type { RouteDetail, RoutePattern } from '../../types/route';
import type { GroupedChildStop, StopDetail, StopRoutesResponse } from '../../types/stop';
import type { VehiclePosition } from '../../types/vehicle';
import type { MavStopConnections } from './queries';
import { uniqueVehiclePositions } from '../../../vehicle-position';

export function decodedCoordinates(points?: string | null): [number, number][] {
  if (!points) return [];
  try {
    return decodePolyline(points).map(({ lat, lon }) => [lon, lat]);
  } catch {
    return [];
  }
}

export function normalizePattern(pattern: Provider.RoutePattern): RoutePattern {
  return { ...pattern, coordinates: decodedCoordinates(pattern.patternGeometry?.points) };
}

export function normalizeRoute(route: Provider.RouteDetail | null): RouteDetail | null {
  return route ? { ...route, patterns: route.patterns?.filter(pattern =>
    !/^BKK[:_]/.test(route.id) || !Array.isArray(pattern.tripsForDate) || pattern.tripsForDate.length > 0
  ).map(normalizePattern) } : null;
}

export function normalizeTrip(trip: Provider.TripDetail | null): DecodedTripDetail | null {
  return trip
    ? {
        ...trip,
        stoptimes: trip.stoptimes?.map((time) => ({ ...time, stop: { ...time.stop } })),
        decodedPolyline: decodedCoordinates(trip.tripGeometry?.points).map(([lon, lat]) => [
          lat,
          lon,
        ]),
      }
    : null;
}

export function normalizeStop(stop: Provider.StopDetail | null): StopDetail | null {
  return stop
    ? {
        ...stop,
        stopTimes: stop.stopTimes?.map((group) => ({ ...group, times: group.times ?? [] })),
      }
    : null;
}

export function normalizeStopRoutes(
  stop: Provider.StopRoutesResponse | null,
): StopRoutesResponse | null {
  return stop ? { ...stop, routes: stop.routes ?? [] } : null;
}

export function normalizeStops(stops: Provider.GroupedChildStop[] | null): GroupedChildStop[] {
  return (stops ?? []).map((stop) => ({ ...stop, routes: stop.routes ?? [] }));
}

export function normalizeVehicles(vehicles: Provider.VehiclePosition[] | null): VehiclePosition[] {
  return uniqueVehiclePositions((vehicles ?? []).filter((vehicle) => validCoordinates(vehicle.lon, vehicle.lat)))
    .map((vehicle) => ({ ...vehicle }));
}

export function normalizeConnections(
  stop: MavStopConnections | null,
): StopConnectionsResponse | null {
  return stop
    ? {
        ...stop,
        routes: (stop.routes ?? []).map((route) => ({
          ...route,
          patterns: route.patterns?.map((pattern) => ({
            ...pattern,
            coordinates: decodedCoordinates(pattern.patternGeometry?.points),
          })),
        })),
      }
    : null;
}
