import { replaceEqualDeep, useQuery } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useUIStore } from '@/store/useUIStore';
import type { DecodedTripDetail } from '@/lib/transit/client';
import { retainVehicleListMetadata } from '@/lib/vehicle-position';
import { LIVE_QUERY_OPTIONS } from '@/lib/live-query';

export type { DecodedTripDetail } from '@/lib/transit/client';

export function useTripDetail(tripId: string | null, serviceDay?: string, live = false) {
  const language = useUIStore((state) => state.language);
  const day = serviceDay?.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
  return useQuery<DecodedTripDetail | null>({
    queryKey: transitQueryKey('trip-detail', language, tripId, day),
    queryFn: ({ signal }) =>
      tripId ? getTransit(signal, language).trip(tripId, day) : null,
    enabled: !!tripId,
    ...LIVE_QUERY_OPTIONS,
    structuralSharing: (previous, incoming) => {
      const oldTrip = previous as DecodedTripDetail | null | undefined;
      const trip = incoming as DecodedTripDetail | null;
      return replaceEqualDeep(
        previous,
        trip?.vehiclePositions
          ? {
              ...trip,
              vehiclePositions: retainVehicleListMetadata(
                trip.vehiclePositions,
                oldTrip?.vehiclePositions ?? [],
              ),
            }
          : trip,
      );
    },
    refetchInterval: live ? 20_000 : false,
  });
}
