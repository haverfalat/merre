import { useQuery } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useUIStore } from '@/store/useUIStore';
import { SEARCH_STALE_TIME } from '@/lib/transit/query-policy';
import type { GeoJsonFeatureCollection } from '@/lib/transit/types/geo';

export function useGeocode(query: string) {
  const language = useUIStore((state) => state.language);
  return useQuery<GeoJsonFeatureCollection>({
    queryKey: transitQueryKey('geocode', language, query),
    queryFn: async ({ signal }) => {
      const transit = getTransit(signal, language);
      if (!query || query.trim().length < 2) return { type: 'FeatureCollection', features: [] };
      return await transit.geocode(query.trim(), { limit: 6 });
    },
    enabled: query.trim().length >= 2,
    staleTime: SEARCH_STALE_TIME,
  });
}
