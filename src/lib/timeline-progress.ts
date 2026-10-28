import type { TripStopTime } from './transit/types/trip';
import type { VehiclePosition } from './transit/types/vehicle';
import { activeStopIndex, validCoordinates } from './transit';
import { stopTiming } from './transit/stop-times';

export function timelineProgress(
  stops: TripStopTime[],
  vehicle: VehiclePosition | null | undefined,
  now: number,
) {
  const nextIndex = activeStopIndex(stops, vehicle, now);
  if (nextIndex < 0 || !vehicle) return { nextIndex, atStopIndex: -1, between: null };
  if (vehicle.stopRelationship?.status === 'STOPPED_AT' || nextIndex === 0) {
    return { nextIndex, atStopIndex: nextIndex, between: null };
  }
  const previous = stops[nextIndex - 1];
  const next = stops[nextIndex];
  let fraction = 0.5;
  let estimated = true;
  if (
    validCoordinates(vehicle.lon, vehicle.lat) &&
    validCoordinates(previous.stop.lon, previous.stop.lat) &&
    validCoordinates(next.stop.lon, next.stop.lat)
  ) {
    const scale = Math.cos((previous.stop.lat! * Math.PI) / 180);
    const dx = (next.stop.lon! - previous.stop.lon!) * scale;
    const dy = next.stop.lat! - previous.stop.lat!;
    const length = dx * dx + dy * dy;
    if (length > 0) {
      fraction =
        ((vehicle.lon! - previous.stop.lon!) * scale * dx +
          (vehicle.lat! - previous.stop.lat!) * dy) /
        length;
      estimated = false;
    }
  }
  if (estimated) {
    const departure = stopTiming(previous, 'departures').seconds;
    const arrival = stopTiming(next, 'arrivals').seconds;
    if (
      previous.serviceDay != null &&
      next.serviceDay != null &&
      departure != null &&
      arrival != null
    ) {
      const start = previous.serviceDay + departure;
      const end = next.serviceDay + arrival;
      if (end > start) fraction = (now / 1000 - start) / (end - start);
    }
  }
  return {
    nextIndex,
    atStopIndex: -1,
    between: {
      afterStopIndex: nextIndex - 1,
      fraction: Math.max(0, Math.min(1, fraction)),
      estimated,
    },
  };
}
