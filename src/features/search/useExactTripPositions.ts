import { useQueries } from '@tanstack/react-query';
import { cleanTransitLabel } from '~/lib/transit/labels';
import { getTransit, transitQueryKey } from '~/lib/transit/service';
import type { SearchTripSummary } from '~/lib/transit/types/geo';

/** Check exact service-number hits even when the train is outside the map viewport. */
export function useExactTripPositions(query: string, trips: SearchTripSummary[] | undefined,
  date: string, language: 'hu' | 'en', enabled: boolean) {
  const number = query.trim().toLocaleLowerCase();
  const ids = [...new Set((trips ?? []).filter(trip => number &&
    cleanTransitLabel(trip.tripShortName).toLocaleLowerCase().split(/\s+/).includes(number))
    .map(trip => trip.gtfsId || trip.id).filter((id): id is string => !!id))].slice(0, 8);
  return useQueries({
    queries: ids.map(id => ({
      queryKey: transitQueryKey('trip-positions', language, id, date),
      enabled,
      staleTime: 15_000,
      refetchInterval: 20_000,
      retry: false as const,
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        const transit = getTransit(signal, language);
        const positions = await transit.vehiclePositionsForTrip(id, date).catch(() => {
          signal.throwIfAborted();
          return [];
        });
        if (positions.length) return positions;
        return (await transit.trip(id, date))?.vehiclePositions ?? [];
      },
    })),
    combine: results => results.flatMap((result, index) =>
      (result.data ?? []).map(position => ({ id: ids[index], position }))),
  });
}
