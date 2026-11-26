import { useQuery } from '@tanstack/react-query';
import { readCachedStopsInBounds, rememberStopsInCache } from '@/lib/stop-cache';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import { snapBounds } from '@/lib/transit';

export function useStopsInBounds(enabled = true) {
  const bbox = useMapStore((state) => state.bbox);
  const zoom = useMapStore((state) => state.zoom);
  const language = useUIStore((state) => state.language);
  const cbox = bbox ? snapBounds(bbox, 0.02) : null;
  return useQuery({
    queryKey: transitQueryKey('stops-in-bounds', language, cbox),
    queryFn: async ({ signal }) => {
      if (!cbox) return [];
      const stops = await getTransit(signal, language).stopsInBounds(cbox);
      rememberStopsInCache(stops);
      return stops;
    },
    placeholderData: (previous) => previous ?? (cbox ? readCachedStopsInBounds(cbox) : undefined),
    staleTime: 600_000,
    gcTime: 1_800_000,
    enabled: enabled && !!cbox && zoom >= 12,
  });
}
