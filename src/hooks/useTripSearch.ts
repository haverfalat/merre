import { useQuery } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useNow } from './useNow';
import { useUIStore } from '@/store/useUIStore';
import { serviceDate } from '@/lib/transit';
import { SEARCH_STALE_TIME } from '@/lib/transit/query-policy';
import type { SearchTripSummary } from '@/lib/transit/types/geo';
import { TRANSIT_MODES } from '@/lib/transit/modes';

export function useTripSearch(query: string) {
  const date = serviceDate(useNow());
  const language = useUIStore((state) => state.language);
  return useQuery<SearchTripSummary[]>({
    queryKey: transitQueryKey('trip-search', language, date, query),
    queryFn: async ({ signal }) => {
      const transit = getTransit(signal, language);
      if (!query || query.trim().length < 2) return [];
      return await transit.searchTrips({
        searchString: query.trim(),
        modes: TRANSIT_MODES,
        date,
      });
    },
    enabled: query.trim().length >= 2,
    staleTime: SEARCH_STALE_TIME,
  });
}
