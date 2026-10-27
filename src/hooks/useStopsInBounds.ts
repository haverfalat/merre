import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import { snapBounds } from '@/lib/transit';

export function useStopsInBounds(enabled = true) {
  const bbox = useMapStore((state) => state.bbox);
  const zoom = useMapStore((state) => state.zoom);
  const language = useUIStore((state) => state.language);
  const cbox = bbox ? snapBounds(bbox, 0.01) : null;
  return useQuery({
    queryKey: transitQueryKey('stops-in-bounds', language, cbox),
    queryFn: ({ signal }) => (cbox ? getTransit(signal, language).stopsInBounds(cbox) : []),
    placeholderData: keepPreviousData,
    staleTime: 120_000,
    gcTime: 300_000,
    enabled: enabled && !!cbox && zoom >= 12,
  });
}
