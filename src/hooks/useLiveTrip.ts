import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNow } from './useNow';
import { useTripDetail } from './useTripDetail';
import { useUIStore } from '@/store/useUIStore';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { serviceDate } from '@/lib/transit/time/service-day';
import { uniqueVehiclePositions } from '@/lib/vehicle-position';
import { LIVE_QUERY_OPTIONS } from '@/lib/live-query';

/** Share fast positions between the map and panel; keep geometry off the fast path. */
export function useLiveTrip(id: string | null, serviceDay?: string) {
  const trip = useTripDetail(id, serviceDay, true);
  const language = useUIStore((s) => s.language);
  const client = useQueryClient();
  const now = useNow();
  const day = (serviceDay ?? serviceDate(now)).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
  const positions = useQuery({
    queryKey: transitQueryKey('trip-positions', language, id, day),
    enabled: !!id,
    ...LIVE_QUERY_OPTIONS,
    staleTime: 2_500,
    refetchInterval: 2_500,
    queryFn: async ({ signal }) => {
      const transit = getTransit(signal, language);
      const fixes = await transit.vehiclePositionsForTrip(id!, day).catch(() => {
        signal.throwIfAborted();
        return [];
      });
      if (fixes.length) return fixes;
      // Not every national train is covered by the lightweight endpoint.
      const fallback = await client.fetchQuery({
        queryKey: transitQueryKey('trip-position-fallback', language, id, day),
        staleTime: 5_000,
        queryFn: ({ signal: fallbackSignal }) => getTransit(fallbackSignal, language).trip(id!, day),
      });
      return fallback?.vehiclePositions ?? [];
    },
  });
  const data = useMemo(() => trip.data ? {
    ...trip.data,
    vehiclePositions: uniqueVehiclePositions([
      ...(trip.data.vehiclePositions ?? []), ...(positions.data ?? []),
    ]),
  } : trip.data, [trip.data, positions.data]);
  return { ...trip, data };
}
