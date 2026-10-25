import type { VehiclePosition } from './transit/types/vehicle';
import { nearestHeading, normalizeHeading } from './location';
import { validCoordinates } from './transit';

export const VEHICLE_MOTION_MS = 1_200;
export const VEHICLE_FRAME_MS = 1000 / 30;
export const vehicleMotionKey = (position: VehiclePosition) =>
  position.vehicleId ||
  `${position.trip?.gtfsId || position.trip?.id}|${position.trip?.serviceDate?.replaceAll('-', '') ?? ''}`;

const hasHeading = (value: number | null) =>
  value !== null && Number.isFinite(value) && value >= 0 && value <= 360;

export function interpolateVehicle(
  from: VehiclePosition | undefined,
  to: VehiclePosition,
  progress: number,
): VehiclePosition {
  if (!from || !validCoordinates(from.lon, from.lat) || !validCoordinates(to.lon, to.lat))
    return to;
  if (from.lastUpdated != null && to.lastUpdated != null && to.lastUpdated < from.lastUpdated)
    return from;
  // A feed correction or a reassigned vehicle must not slide across the map.
  const distance =
    Math.hypot((to.lon! - from.lon!) * Math.cos((to.lat! * Math.PI) / 180), to.lat! - from.lat!) *
    111_195;
  if (distance > 2_000 || progress >= 1) return to;
  const t = Math.max(0, progress);
  const eased = t * t * (3 - 2 * t);
  return {
    ...to,
    lon: from.lon! + (to.lon! - from.lon!) * eased,
    lat: from.lat! + (to.lat! - from.lat!) * eased,
    heading:
      hasHeading(from.heading) && hasHeading(to.heading)
        ? normalizeHeading(
            from.heading! + (nearestHeading(from.heading!, to.heading!) - from.heading!) * eased,
          )
        : to.heading,
  };
}
