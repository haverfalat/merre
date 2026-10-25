import { useQuery } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useNow } from './useNow';
import { useUIStore } from '@/store/useUIStore';
import { serviceDate } from '@/lib/transit';
import { QUERY_STALE } from '@/lib/transit/query-policy';
import type { SearchTripSummary } from '@/lib/transit/types/geo';
import type { Mode } from '@/lib/transit/types/common';

const ALL_TRANSIT_MODES: Mode[] = [
  'BUS',
  'COACH',
  'RAIL',
  'SUBURBAN_RAILWAY',
  'TRAM',
  'TRAMTRAIN',
  'SUBWAY',
  'TROLLEYBUS',
  'FERRY',
  'RAIL_REPLACEMENT_BUS',
];

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
        modes: ALL_TRANSIT_MODES,
        date,
      });
    },
    enabled: query.trim().length >= 2,
    staleTime: QUERY_STALE.SEARCH,
  });
}
