import { nearestHeading } from './location';

export type VehicleCameraMode = 'free' | 'centered' | 'heading';

export function vehicleCameraBearing(previous: number, heading: number | null | undefined) {
  return heading != null && Number.isFinite(heading) && heading >= 0 && heading <= 360
    ? nearestHeading(previous, heading)
    : previous;
}

/** Billboard arrows need the heading relative to the rotated map. */
export function screenHeading(heading: number, bearing: number) {
  return nearestHeading(0, heading - bearing);
}
