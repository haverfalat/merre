import { vehiclesForRoute, vehiclesForStop } from '@/lib/focused-vehicles';
import { tripVehiclePositions } from '@/lib/transit/trip-vehicles';
import type { Mode } from '@/lib/transit/types/common';
import type { RouteDetail } from '@/lib/transit/types/route';
import type { StopRoutesResponse } from '@/lib/transit/types/stop';
import type { TripDetail } from '@/lib/transit/types/trip';
import type { VehiclePosition } from '@/lib/transit/types/vehicle';
import type { SelectedVehicle } from '@/store/useMapStore';

interface MapVehicleInput {
  routeId: string | null;
  route: RouteDetail | null | undefined;
  stopId: string | null;
  stopIds: string[];
  stopRoutes: StopRoutesResponse | null | undefined;
  selectedRoutes: string[] | null;
  vehicles: VehiclePosition[] | undefined;
  trip: TripDetail | null | undefined;
  selection: SelectedVehicle | null;
  modes: Mode[];
}

export function selectedMapVehicles({
  routeId,
  route,
  stopId,
  stopIds,
  stopRoutes,
  selectedRoutes,
  vehicles,
  trip,
  selection,
  modes,
}: MapVehicleInput) {
  const entries = routeId
    ? vehiclesForRoute(route)
    : stopId
      ? vehiclesForStop(stopRoutes, stopIds.length ? stopIds : [stopId], selectedRoutes)
      : [...(vehicles ?? []), ...tripVehiclePositions(trip, selection?.serviceDay)];
  const unique = new Map<string, (typeof entries)[number]>();
  for (const entry of entries) {
    const key =
      entry.vehicleId || `${entry.trip?.gtfsId || entry.trip?.id}|${entry.trip?.serviceDate}`;
    const previous = unique.get(key);
    if (!previous || (entry.lastUpdated ?? 0) >= (previous.lastUpdated ?? 0))
      unique.set(key, entry);
  }
  const focused = [...unique.values()].filter((v) => {
    if (selection) {
      if (selection.vehicleId && v.vehicleId && selection.vehicleId !== v.vehicleId) return false;
      return (
        ((v.trip?.gtfsId || v.trip?.id) === selection.tripId ||
          (!!selection.vehicleId && v.vehicleId === selection.vehicleId)) &&
        (!selection.serviceDay ||
          !v.trip?.serviceDate ||
          selection.serviceDay.replaceAll('-', '') === v.trip.serviceDate.replaceAll('-', ''))
      );
    }
    return !!routeId || !!stopId || (!!v.trip?.route?.mode && modes.includes(v.trip.route.mode));
  });
  return selection && trip
    ? tripVehiclePositions({ ...trip, vehiclePositions: focused }, selection.serviceDay)
    : focused;
}
