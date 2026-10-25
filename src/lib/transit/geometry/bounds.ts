import { validCoordinates } from '../../transit';
import type { GroupedChildStop } from '../types/stop';
import type { VehicleBounds } from '../types/vehicle';

export function boundsRadius(bounds: VehicleBounds) {
  const lat = (bounds.swLat + bounds.neLat) / 2;
  const lon = (bounds.swLon + bounds.neLon) / 2;
  const dLat = (bounds.neLat - bounds.swLat) * 111_000;
  const dLon = (bounds.neLon - bounds.swLon) * 111_000 * Math.cos((lat * Math.PI) / 180);
  return { lat, lon, radius: Math.max(1000, Math.ceil(Math.hypot(dLat, dLon) / 2)) };
}

export function stopsWithinBounds(stops: GroupedChildStop[], bounds: VehicleBounds) {
  const { lat, lon } = boundsRadius(bounds);
  const seen = new Set<string>();
  return stops
    .filter((stop) => {
      const id = stop.gtfsId || stop.id;
      if (!id || seen.has(id) || !validCoordinates(stop.lon, stop.lat)) return false;
      if (
        stop.lat! < bounds.swLat ||
        stop.lat! > bounds.neLat ||
        stop.lon! < bounds.swLon ||
        stop.lon! > bounds.neLon
      )
        return false;
      seen.add(id);
      return true;
    })
    .sort((a, b) => Math.hypot(a.lat! - lat, a.lon! - lon) - Math.hypot(b.lat! - lat, b.lon! - lon))
    .slice(0, 1000);
}
