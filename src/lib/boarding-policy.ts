import { destinationBoarding } from '@/lib/boarding';
import type { TripDetail, TripStopTime } from '@/lib/transit/types/trip';

export function hasFrontDoorBoarding(...headsigns: (string | null | undefined)[]) {
  return headsigns.some((headsign) => destinationBoarding(headsign || '').frontDoor);
}
export function tripFrontDoorBoarding(
  trip: TripDetail | null | undefined,
  selected = false,
  positionHeadsign?: string | null,
) {
  return (
    selected || hasFrontDoorBoarding(trip?.tripHeadsign, trip?.pattern?.headsign, positionHeadsign)
  );
}
/** A service-level policy applies only where this trip actually permits boarding. */
export function stopFrontDoorBoarding(
  time: TripStopTime | null,
  index: number,
  count: number,
  tripPolicy: boolean,
) {
  return (
    index < count - 1 &&
    time?.pickupType !== 'NONE' &&
    time?.realtimeState !== 'CANCELED' &&
    time?.realtimeState !== 'SKIPPED' &&
    (tripPolicy || hasFrontDoorBoarding(time?.headsign))
  );
}
