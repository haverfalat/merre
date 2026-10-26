import { cleanTransitLabel, cleanTransitPlaceName } from '@/lib/transit/labels';
import type { RoutePattern } from '@/lib/transit/types/route';

export function routeDirectionDetails(pattern: RoutePattern) {
  const stops = pattern.stops ?? [];
  const stopLabel = (stop: (typeof stops)[number] | undefined, fallback?: string | null) => {
    const name = cleanTransitPlaceName(stop?.name || fallback);
    const platform = stop?.platformCode?.trim();
    return platform ? `${name} (${platform})` : name;
  };
  const origin = stopLabel(stops[0], pattern.fromStopName);
  const destination = stopLabel(stops.at(-1), pattern.headsign);
  const codes = [
    ...new Set(
      (pattern.trips ?? []).map((trip) => cleanTransitLabel(trip.tripShortName)).filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return {
    title: [origin, destination].filter(Boolean).join(' → '),
    codes,
    count: stops.length,
  };
}
