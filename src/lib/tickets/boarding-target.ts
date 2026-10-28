import type { BoardingRequest } from './types';
import type { VehiclePosition } from '../transit/types/vehicle';

/** Resolve the selected trip's vehicle; a route number alone must never pick a bus. */
export function boardingTargetForTrip(request: BoardingRequest, vehicles: VehiclePosition[]) {
  const trip = request.trip;
  if (!trip) return undefined;
  const matches = vehicles.filter((v) => {
    const date = v.trip?.serviceDate;
    const tripId = v.trip?.gtfsId ?? v.trip?.id;
    return !!v.licensePlate &&
      (!trip.serviceDay || !date || trip.serviceDay.replaceAll('-', '') === date.replaceAll('-', '')) &&
      (tripId ? tripId === trip.id : !!trip.vehicleId && v.vehicleId === trip.vehicleId);
  });
  if (matches.length !== 1) return undefined;
  return { kind: 'vehicle', licensePlate: matches[0].licensePlate!,
    title: `${request.route ?? ''} · ${matches[0].licensePlate}` };
}
