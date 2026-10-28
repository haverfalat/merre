import { vehiclesForRoute, vehiclesForStop } from '@/lib/focused-vehicles';
import { tripVehiclePositions } from '@/lib/transit/trip-vehicles';
import type { Mode } from '@/lib/transit/types/common';
import type { RouteDetail } from '@/lib/transit/types/route';
import type { StopRoutesResponse } from '@/lib/transit/types/stop';
import type { TripDetail } from '@/lib/transit/types/trip';
import type { VehiclePosition } from '@/lib/transit/types/vehicle';
import type { SelectedVehicle } from '@/store/useMapStore';
import { matchesSelectedVehicle, uniqueVehiclePositions } from '@/lib/vehicle-position';

interface MapVehicleInput {
  routeId: string | null;
  route: RouteDetail | null | undefined;
  stopId: string | null;
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
      ? vehiclesForStop(stopRoutes, stopId, selectedRoutes)
      : [...(vehicles ?? []), ...tripVehiclePositions(trip, selection?.serviceDay)];
  const focused = uniqueVehiclePositions(entries).filter((v) => {
    if (selection) {
      return matchesSelectedVehicle(v, selection);
    }
    return !!routeId || !!stopId || (!!v.trip?.route?.mode && modes.includes(v.trip.route.mode));
  });
  return selection && trip
    ? tripVehiclePositions({ ...trip, vehiclePositions: focused }, selection.serviceDay)
    : focused;
}
