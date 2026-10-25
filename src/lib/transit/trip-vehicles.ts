import type { TripDetail } from './types/trip';
import type { VehiclePosition } from './types/vehicle';

export function tripVehiclePositions(
  trip: TripDetail | null | undefined,
  serviceDay?: string,
): VehiclePosition[] {
  if (!trip) return [];
  return (trip.vehiclePositions ?? []).map((position) => ({
    ...position,
    trip: {
      ...position.trip,
      id: position.trip?.id ?? trip.id,
      gtfsId: position.trip?.gtfsId ?? trip.id,
      routeShortName: position.trip?.routeShortName || trip.route?.shortName || null,
      tripHeadsign: position.trip?.tripHeadsign ?? trip.tripHeadsign ?? null,
      tripShortName: position.trip?.tripShortName ?? trip.tripShortName ?? null,
      serviceDate: position.trip?.serviceDate ?? serviceDay,
      route:
        trip.route || position.trip?.route
          ? {
              id: position.trip?.route?.id ?? trip.route?.id,
              shortName: position.trip?.route?.shortName || trip.route?.shortName || null,
              longName: position.trip?.route?.longName ?? trip.route?.longName ?? null,
              mode: position.trip?.route?.mode ?? trip.route?.mode ?? null,
              color: position.trip?.route?.color ?? trip.route?.color ?? null,
              textColor: position.trip?.route?.textColor ?? trip.route?.textColor ?? null,
            }
          : null,
      pattern: position.trip?.pattern ?? trip.pattern ?? null,
    },
  }));
}
