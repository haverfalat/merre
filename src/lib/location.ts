export function normalizeHeading(value: number): number {
  return ((value % 360) + 360) % 360;
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
