import type {
  ConnectionPoint,
  ConnectionPattern,
  StopConnectionsResponse,
} from './transit/types/connections';
import { validCoordinates } from './transit';
import { findBoardingStop } from './boarding-stops';

function projectOntoPath(path: ConnectionPoint[], point: ConnectionPoint, start: number) {
  const longitudeScale = Math.cos((point[1] * Math.PI) / 180);
  let best = { progress: start, point: path[Math.floor(start)], distance: Infinity };
  for (let i = Math.floor(start); i < path.length - 1; i++) {
    const a = path[i],
      b = path[i + 1];
    const dx = (b[0] - a[0]) * longitudeScale,
      dy = b[1] - a[1];
    const length = dx * dx + dy * dy;
    const t = Math.max(
      i === Math.floor(start) ? start - i : 0,
      Math.min(
        1,
        length ? ((point[0] - a[0]) * longitudeScale * dx + (point[1] - a[1]) * dy) / length : 0,
      ),
    );
    const projected: ConnectionPoint = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const distance =
      ((projected[0] - point[0]) * longitudeScale) ** 2 + (projected[1] - point[1]) ** 2;
    if (distance < best.distance - 1e-15) best = { progress: i + t, point: projected, distance };
  }
  return best;
}

export function downstreamPattern(pattern: ConnectionPattern, stopId: string) {
  const allStops = pattern.stops ?? [];
  const index = allStops.findIndex((stop) => stop.id === stopId);
  if (index < 0 || index >= allStops.length - 1) return null;
  const stops = allStops.slice(index).filter((stop) => validCoordinates(stop.lon, stop.lat));
  if (!stops.length || stops[0].id !== stopId) return null;
  let coordinates: ConnectionPoint[] = stops.map((stop) => [stop.lon!, stop.lat!]);
  if (pattern.coordinates?.length) {
    try {
      const path = pattern.coordinates;
      if (path.length >= 2 && path.every(([lon, lat]) => validCoordinates(lon, lat))) {
        let projection = { progress: 0, point: path[0] };
        // Match in stop order so a loop/crossing cannot clip at an earlier visit.
        for (const stop of allStops.slice(0, index + 1)) {
          if (validCoordinates(stop.lon, stop.lat))
            projection = projectOntoPath(path, [stop.lon!, stop.lat!], projection.progress);
        }
        coordinates = [
          [stops[0].lon!, stops[0].lat!],
          projection.point,
          ...path.slice(Math.floor(projection.progress) + 1),
        ];
      }
    } catch {
      /* A broken shape still has an ordered stop-to-stop fallback. */
    }
  }
  return coordinates.length >= 2 ? { coordinates, stops } : null;
}

export function stopConnections(
  data: StopConnectionsResponse | null | undefined,
  stopId: string | string[] | null,
  routeIds: string[] | null,
) {
  if (!data || !stopId) return [];
  const ids = Array.isArray(stopId) ? stopId : [stopId];
  const seen = new Set<string>();
  return data.routes
    .filter((route) => routeIds === null || routeIds.includes(route.id))
    .flatMap((route) =>
      (route.patterns ?? []).flatMap((pattern) => {
        const origin = findBoardingStop(pattern.stops ?? [], ids, data.boardingStops ?? [data]);
        const downstream = origin ? downstreamPattern(pattern, origin.id) : null;
        if (!downstream) return [];
        const key = `${route.id}|${downstream.stops.map((stop) => stop.id).join('|')}|${JSON.stringify(downstream.coordinates)}`;
        if (seen.has(key)) return [];
        seen.add(key);
        return [{ ...downstream, route, id: `${route.id}-${pattern.id}` }];
      }),
    );
}
