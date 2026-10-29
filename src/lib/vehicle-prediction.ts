import type { VehiclePosition } from './transit/types/vehicle';

export type VehiclePath = [latitude: number, longitude: number][];

/** Advance only a short distance along a nearby, forward-facing confirmed route. */
export function predictVehicle(position: VehiclePosition, path: VehiclePath | undefined, elapsed: number): VehiclePosition {
  const age = Date.now() / 1000 - (position.lastUpdated ?? 0);
  if (!path || path.length < 2 || position.isEstimated !== false || age < -5 || age - Math.max(0, elapsed) > 30 ||
    position.lat == null || position.lon == null || position.heading == null ||
    position.speed == null || !Number.isFinite(position.speed) || position.speed <= 0 ||
    position.stopRelationship?.status !== 'IN_TRANSIT_TO') return position;
  const scale = Math.cos(position.lat * Math.PI / 180);
  const x = (lon: number) => (lon - position.lon!) * 111_195 * scale;
  const y = (lat: number) => (lat - position.lat!) * 111_195;
  let best = Infinity, segment = -1, fraction = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const ax = x(path[i][1]), ay = y(path[i][0]);
    const dx = x(path[i + 1][1]) - ax, dy = y(path[i + 1][0]) - ay;
    const length2 = dx * dx + dy * dy;
    if (!length2) continue;
    const bearing = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
    if (Math.abs(((bearing - position.heading + 540) % 360) - 180) > 60) continue;
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length2));
    const distance = Math.hypot(ax + t * dx, ay + t * dy);
    if (distance < best) { best = distance; segment = i; fraction = t; }
  }
  if (best > 35 || segment < 0) return position;
  let remaining = Math.min(150, position.speed * Math.max(0, Math.min(elapsed, 3)));
  for (let i = segment; i < path.length - 1; i++) {
    const start = i === segment ? fraction : 0;
    const a = path[i], b = path[i + 1];
    const length = Math.hypot(x(b[1]) - x(a[1]), y(b[0]) - y(a[0]));
    if (!length) continue;
    const available = length * (1 - start);
    if (remaining <= available) {
      const t = start + remaining / length;
      // Preserve the measured off-route offset: prediction must not snap the GPS fix.
      const origin = path[segment], end = path[segment + 1];
      const originLat = origin[0] + fraction * (end[0] - origin[0]);
      const originLon = origin[1] + fraction * (end[1] - origin[1]);
      return { ...position, heading: (Math.atan2(x(b[1]) - x(a[1]), y(b[0]) - y(a[0])) * 180 / Math.PI + 360) % 360, lat: position.lat + a[0] + t * (b[0] - a[0]) - originLat,
        lon: position.lon + a[1] + t * (b[1] - a[1]) - originLon };
    }
    remaining -= available;
  }
  const origin = path[segment], end = path[segment + 1], last = path[path.length - 1];
  return { ...position,
    lat: position.lat + last[0] - (origin[0] + fraction * (end[0] - origin[0])),
    lon: position.lon + last[1] - (origin[1] + fraction * (end[1] - origin[1])),
  };
}
