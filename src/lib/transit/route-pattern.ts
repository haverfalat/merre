import { cleanTransitPlaceName } from './labels';
import type { RouteDetail, RoutePattern } from './types/route';

/** A trip can select a source pattern while the route displays a reference variant. */
export function selectedRoutePattern(route: RouteDetail | null | undefined, id: string | null) {
  return route?.patterns?.find(pattern => pattern.id === id ||
    (!!id && pattern.tripPatternIds?.includes(id))) ?? route?.patterns?.[0];
}

/** Link scheduled patterns to reference variants by ordered physical stop IDs.
 * A headsign alone is insufficient for short turns and branches with the same name.
 */
export function referenceRoutePatterns(reference: NonNullable<RouteDetail['patterns']>, original: NonNullable<RouteDetail['patterns']>) {
  const result = reference.map(pattern => ({ ...pattern, turnStopId: undefined as string | undefined, tripPatternIds: [] as string[],
    vehiclePositions: [] as NonNullable<typeof pattern.vehiclePositions> }));
  const unmatched: typeof original = [];
  for (const source of original) {
    const ids = (source.stops ?? []).map(stop => stop.gtfsId || stop.id).filter(Boolean);
    let best: (typeof result)[number] | undefined;
    let bestScore = 0;
    for (const candidate of result) {
      const stops = (candidate.stops ?? []).map(stop => stop.gtfsId || stop.id);
      // A short turn must be a contiguous slice, not a subsequence that
      // silently skips a detour or intermediate stops.
      const contains = (whole: typeof ids, part: typeof ids) => part.length > 0 &&
        whole.some((_, start) => start + part.length <= whole.length &&
          part.every((id, offset) => !!id && id === whole[start + offset]));
      if (!contains(stops, ids) && !contains(ids, stops)) continue;
      const matches = Math.min(ids.length, stops.length);
      const score = matches / Math.max(ids.length, stops.length) +
        (source.headsign?.trim() === candidate.headsign?.trim() ? 1 : 0);
      if (score > bestScore) { best = candidate; bestScore = score; }
    }
    if (!best) { unmatched.push(source); continue; }
    if (source.id) best.tripPatternIds.push(source.id);
    if (ids[0] === (best.stops?.[0]?.gtfsId || best.stops?.[0]?.id) &&
      source.headsign?.trim() === best.headsign?.trim()) best.turnStopId = ids.at(-1) ?? undefined;
    best.vehiclePositions.push(...(source.vehiclePositions ?? []));
  }
  // Preserve unusual service variants and their vehicles when no reference covers them.
  return combineReferenceLoop([...result, ...unmatched]);
}

/** Two overlapping reference halves may describe one continuous passenger loop.
 * Only join an exact ordered overlap, a return to the same named terminus,
 * and a matching geometry seam. Individual trips are never changed.
 */
function combineReferenceLoop(patterns: RoutePattern[]): RoutePattern[] {
  if (patterns.length !== 2 || patterns.some(pattern => !pattern.reference)) return patterns;
  for (const [first, second] of [[patterns[0], patterns[1]], [patterns[1], patterns[0]]]) {
    const a = first.stops ?? [], b = second.stops ?? [];
    const origin = cleanTransitPlaceName(a[0]?.name);
    if (!origin || origin !== cleanTransitPlaceName(b.at(-1)?.name)) continue;
    let overlap = 0;
    for (let size = 2; size < Math.min(a.length, b.length); size++) {
      if (a.slice(-size).every((stop, i) => !!(stop.gtfsId || stop.id) &&
        (stop.gtfsId || stop.id) === (b[i].gtfsId || b[i].id))) overlap = size;
    }
    if (!overlap) continue;
    const left = first.coordinates ?? [], right = second.coordinates ?? [];
    if (!left.length || !right.length) continue;
    const end = left.at(-1)!;
    let seam = -1, distance = Infinity;
    right.forEach((point, i) => {
      const meters = Math.hypot((point[0] - end[0]) * Math.cos(end[1] * Math.PI / 180), point[1] - end[1]) * 111_000;
      if (meters < distance) { distance = meters; seam = i; }
    });
    if (distance > 30 || seam < 0) continue;
    const via = cleanTransitPlaceName(first.headsign);
    const turnStopId = first.turnStopId;
    if (!via || via === origin || !turnStopId || !a.some(stop => (stop.gtfsId || stop.id) === turnStopId)) continue;
    const start = a[0], finish = b.at(-1)!;
    if (start.lat == null || start.lon == null || finish.lat == null || finish.lon == null ||
      Math.hypot((start.lon - finish.lon) * Math.cos(start.lat * Math.PI / 180), start.lat - finish.lat) * 111_000 > 500) continue;
    return [{ ...first, id: `loop:${first.id}:${second.id}`, loopVia: via, loopTurnStopId: turnStopId,
      stops: [...a, ...b.slice(overlap)], coordinates: [...left, ...right.slice(seam + 1)],
      tripPatternIds: [...(first.tripPatternIds ?? []), ...(second.tripPatternIds ?? []), first.id!, second.id!],
      vehiclePositions: [...(first.vehiclePositions ?? []), ...(second.vehiclePositions ?? [])] }];
  }
  return patterns;
}
