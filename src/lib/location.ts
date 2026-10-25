import { validCoordinates } from './transit';

export interface UserLocation {
  longitude: number;
  latitude: number;
  accuracy: number;
  heading: number | null;
  timestamp: number;
}

export function normalizeHeading(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function readLocation(position: GeolocationPosition): UserLocation | null {
  const { longitude, latitude, accuracy, heading, speed } = position.coords;
  if (!validCoordinates(longitude, latitude) || !Number.isFinite(accuracy) || accuracy < 0)
    return null;
  return {
    longitude,
    latitude,
    accuracy,
    timestamp: position.timestamp,
    // GPS course is unreliable when stationary; a compass can still supply heading.
    heading:
      heading !== null && Number.isFinite(heading) && speed !== null && speed >= 0.5
        ? normalizeHeading(heading)
        : null,
  };
}

export function compassHeading(
  event: Pick<DeviceOrientationEvent, 'alpha' | 'absolute'> & {
    webkitCompassHeading?: number;
    webkitCompassAccuracy?: number;
  },
  screenAngle = 0,
): number | null {
  if (
    typeof event.webkitCompassHeading === 'number' &&
    Number.isFinite(event.webkitCompassHeading) &&
    (event.webkitCompassAccuracy === undefined || event.webkitCompassAccuracy >= 0)
  ) {
    return normalizeHeading(event.webkitCompassHeading + screenAngle);
  }
  if (event.absolute && event.alpha !== null && Number.isFinite(event.alpha)) {
    return normalizeHeading(360 - event.alpha + screenAngle);
  }
  return null;
}

// Keep rotation continuous across north (359° → 1° turns 2°, not 358°).
export function nearestHeading(previous: number, next: number): number {
  return previous + ((((next - previous + 540) % 360) + 360) % 360) - 180;
}
