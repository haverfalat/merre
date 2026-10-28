import type { BoundingBox } from '@/store/useMapStore';
import type { TripStopTime } from './transit/types/trip';
import type { VehiclePosition } from './transit/types/vehicle';
import { stopTiming } from './transit/stop-times';

export { TRANSIT_TIME_ZONE, serviceDate, serviceDayBounds } from './transit/time/service-day';

export function snapBounds(bbox: BoundingBox, precision: number): BoundingBox {
  const down = (value: number) => Number((Math.floor(value / precision) * precision).toFixed(6));
  const up = (value: number) => Number((Math.ceil(value / precision) * precision).toFixed(6));
  return {
    swLat: down(bbox.swLat),
    swLon: down(bbox.swLon),
    neLat: up(bbox.neLat),
    neLon: up(bbox.neLon),
  };
}

export function validCoordinates(lon: unknown, lat: unknown): boolean {
  return (
    typeof lon === 'number' &&
    typeof lat === 'number' &&
    Number.isFinite(lon) &&
    Number.isFinite(lat) &&
    Math.abs(lon) <= 180 &&
    Math.abs(lat) <= 85.051129
  );
}

export function activeStopIndex(
  stops: TripStopTime[],
  vehicle: VehiclePosition | null | undefined,
  now: number,
): number {
  const currentId = vehicle?.stopRelationship?.stop?.gtfsId;
  if (currentId) {
    const index = stops.findIndex((st) => (st.stop.gtfsId || st.stop.id) === currentId);
    if (index >= 0) return index;
  }
  const name = vehicle?.stopRelationship?.stop?.name || vehicle?.nextStop?.stop?.name;
  if (name) {
    const index = stops.findIndex(
      (st) => st.stop.name?.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    if (index >= 0) return index;
  }
  return stops.findIndex((st) => {
    if (st.realtimeState === 'CANCELED' || st.realtimeState === 'SKIPPED') return false;
    const epoch = stopTiming(st, 'departures').epoch ?? stopTiming(st, 'arrivals').epoch;
    return epoch != null && epoch >= now / 1000;
  });
}
