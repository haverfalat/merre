import { destinationBoarding } from '@/lib/boarding';
import type { TripDetail, TripStopTime } from '@/lib/transit/types/trip';

export function hasFrontDoorBoarding(...headsigns: (string | null | undefined)[]) {
  return headsigns.some((headsign) => destinationBoarding(headsign || '').frontDoor);
}

type BoardingTime = Pick<TripStopTime, 'headsign' | 'requiresFirstDoorBoarding'> & Partial<Pick<TripStopTime,
  'pickupType' | 'realtimeState'>>;

/** The stop's own indication is authoritative; a trip-wide label cannot enable another stop. */
export function stopHasFrontDoorBoarding(time: BoardingTime | null | undefined) {
  return !!time && time.pickupType !== 'NONE' &&
    time.realtimeState !== 'CANCELED' && time.realtimeState !== 'SKIPPED' &&
    (time.requiresFirstDoorBoarding ?? hasFrontDoorBoarding(time.headsign));
}

export function tripFrontDoorBoarding(
  trip: TripDetail | null | undefined,
  selected = false,
  positionHeadsign?: string | null,
) {
  if (trip?.stoptimes?.length)
    return trip.stoptimes.some((time, index, times) => stopFrontDoorBoarding(time, index, times.length));
  return selected || hasFrontDoorBoarding(trip?.tripHeadsign, trip?.pattern?.headsign, positionHeadsign);
}

export function stopFrontDoorBoarding(time: TripStopTime | null, index: number, count: number) {
  return index < count - 1 && stopHasFrontDoorBoarding(time);
}
