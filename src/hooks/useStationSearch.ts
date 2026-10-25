import { useQuery } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useUIStore } from '@/store/useUIStore';
import { QUERY_STALE } from '@/lib/transit/query-policy';
import type { StationSearchResult } from '@/lib/transit/types/geo';

export function useStationSearch(query: string) {
  const language = useUIStore((state) => state.language);
  return useQuery<StationSearchResult | null>({
    queryKey: transitQueryKey('station-search', language, query),
    queryFn: async ({ signal }) => {
      const transit = getTransit(signal, language);
      if (!query || query.trim().length < 2) return null;
      return await transit.geocodeStations(query.trim(), { limit: 12 });
    },
    enabled: query.trim().length >= 2,
    staleTime: QUERY_STALE.SEARCH,
  });
}
