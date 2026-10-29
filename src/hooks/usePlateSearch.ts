import { useQuery } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { TRANSIT_MODES } from '@/lib/transit/modes';
import { useUIStore } from '@/store/useUIStore';

import { isPlateQuery } from '@/lib/transit/search/plates';

/** Only load national live vehicles for a plate-shaped query, sharing one snapshot across edits. */
export function usePlateSearch(query: string) {
  const language = useUIStore((s) => s.language);
  return useQuery({
    queryKey: transitQueryKey('plate-search-vehicles', language),
    enabled: isPlateQuery(query),
    staleTime: 15_000,
    refetchInterval: isPlateQuery(query) ? 15_000 : false,
    refetchIntervalInBackground: false,
    queryFn: ({ signal }) => getTransit(signal, language).vehiclesInBounds(
      { swLat: 45.7, swLon: 16, neLat: 48.7, neLon: 23 }, TRANSIT_MODES),
  });
}
