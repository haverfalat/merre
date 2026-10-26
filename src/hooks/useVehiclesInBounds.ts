import { useQuery, keepPreviousData, replaceEqualDeep } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import { retainVehicleListMetadata } from '@/lib/vehicle-position';
import type { VehiclePosition } from '@/lib/transit/types/vehicle';
import { LIVE_QUERY_OPTIONS } from '@/lib/live-query';
import { snapBounds } from '@/lib/transit';

export function useVehiclesInBounds(live = false) {
  const bbox = useMapStore((state) => state.bbox);
  const selectedModes = useMapStore((state) => state.selectedModes);
  const language = useUIStore((state) => state.language);
  const cbox = bbox ? snapBounds(bbox, 0.02) : null;
  return useQuery({
    queryKey: transitQueryKey('vehicles-in-bounds', language, cbox, selectedModes),
    queryFn: ({ signal }) =>
      cbox && selectedModes.length
        ? getTransit(signal, language).vehiclesInBounds(cbox, selectedModes)
        : [],
    placeholderData: keepPreviousData,
    structuralSharing: (previous, incoming) =>
      replaceEqualDeep(
        previous,
        retainVehicleListMetadata(
          incoming as VehiclePosition[],
          (previous as VehiclePosition[] | undefined) ?? [],
        ),
      ),
    ...LIVE_QUERY_OPTIONS,
    refetchInterval: live ? LIVE_QUERY_OPTIONS.refetchInterval : false,
    gcTime: 120_000,
    enabled: !!cbox && selectedModes.length > 0,
  });
}
