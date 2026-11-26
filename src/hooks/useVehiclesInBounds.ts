import { useQuery, replaceEqualDeep } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import { retainVehicleListMetadata, uniqueVehiclePositions, vehiclePositionKey } from '@/lib/vehicle-position';
import type { VehicleBounds, VehiclePosition } from '@/lib/transit/types/vehicle';
import type { Mode } from '@/lib/transit/types/common';
import { LIVE_QUERY_OPTIONS } from '@/lib/live-query';
import { snapBounds } from '@/lib/transit';

const recentVehicles = new Map<string, { position: VehiclePosition; seenAt: number }>();

function rememberVehicles(vehicles: VehiclePosition[]) {
  const now = Date.now();
  for (const [k, entry] of recentVehicles) {
    if (now - entry.seenAt > 60_000) recentVehicles.delete(k);
  }
  for (const v of vehicles) {
    if (v.lat != null && v.lon != null) {
      recentVehicles.set(vehiclePositionKey(v), { position: v, seenAt: now });
    }
  }
}

function cachedVehiclesInBounds(bounds: VehicleBounds, modes: Mode[]): VehiclePosition[] | undefined {
  const now = Date.now();
  const hits: VehiclePosition[] = [];
  for (const [k, entry] of recentVehicles) {
    if (now - entry.seenAt > 60_000) {
      recentVehicles.delete(k);
      continue;
    }
    const v = entry.position;
    if (
      v.lat != null &&
      v.lon != null &&
      v.lat >= bounds.swLat &&
      v.lat <= bounds.neLat &&
      v.lon >= bounds.swLon &&
      v.lon <= bounds.neLon &&
      !!v.trip?.route?.mode &&
      modes.includes(v.trip.route.mode)
    ) {
      hits.push(v);
    }
  }
  return hits.length ? uniqueVehiclePositions(hits) : undefined;
}

export function useVehiclesInBounds(live = false, enabled = true) {
  const bbox = useMapStore((state) => state.bbox);
  const selectedModes = useMapStore((state) => state.selectedModes);
  const language = useUIStore((state) => state.language);
  const cbox = bbox ? snapBounds(bbox, 0.02) : null;
  return useQuery({
    queryKey: transitQueryKey('vehicles-in-bounds', language, cbox, selectedModes),
    queryFn: async ({ signal }) => {
      if (!cbox || !selectedModes.length) return [];
      const vehicles = await getTransit(signal, language).vehiclesInBounds(cbox, selectedModes);
      rememberVehicles(vehicles);
      return vehicles;
    },
    placeholderData: (previous) =>
      previous ?? (cbox ? cachedVehiclesInBounds(cbox, selectedModes) : undefined),
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
    enabled: enabled && !!cbox && selectedModes.length > 0,
  });
}
