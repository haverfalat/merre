import { useQuery } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useUIStore } from '@/store/useUIStore';
import { SEARCH_STALE_TIME } from '@/lib/transit/query-policy';
import type { StationSearchResult } from '@/lib/transit/types/geo';

export function useStationSearch(query: string) {
  const language = useUIStore((state) => state.language);
  return useQuery<StationSearchResult | null>({
    queryKey: transitQueryKey('station-search', language, query),
    queryFn: async ({ signal }) => {
      const transit = getTransit(signal, language);
      const trimmed = query.trim();
      if (trimmed.length < 2) return null;
      const tokens = trimmed.split(/\s+/).filter(Boolean);
      const candidates = new Set<string>([trimmed]);
      if (tokens.length >= 2) {
        const dropLast = tokens.slice(0, -1).join(' ');
        const dropFirst = tokens.slice(1).join(' ');
        if (dropLast.length >= 2) candidates.add(dropLast);
        if (dropFirst.length >= 2) candidates.add(dropFirst);
      }
      const responses = await Promise.all(
        [...candidates].map((q) =>
          transit.geocodeStations(q, { limit: 12 }).catch(() => {
            signal.throwIfAborted();
            return null;
          }),
        ),
      );
      const seen = new Set<string>();
      const features: StationSearchResult['features'] = [];
      for (const res of responses) {
        for (const feature of res?.features ?? []) {
          const key = feature.id || `${feature.properties.name}|${feature.geometry.coordinates.join(',')}`;
          if (seen.has(key)) continue;
          seen.add(key);
          features.push(feature);
        }
      }
      return { type: 'FeatureCollection', features };
    },
    enabled: query.trim().length >= 2,
    staleTime: SEARCH_STALE_TIME,
  });
}
