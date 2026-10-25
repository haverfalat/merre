import { useQuery } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useUIStore } from '@/store/useUIStore';
import { serviceDate } from '@/lib/transit';
import { routeTimings } from '@/lib/route-timings';
import type { RoutePattern } from '@/lib/transit/types/route';
import { useNow } from './useNow';

export function useRouteTimetable(routeId: string | null, pattern: RoutePattern | undefined) {
  const language = useUIStore((state) => state.language);
  const date = serviceDate(useNow());
  return useQuery({
    queryKey: transitQueryKey('route-timetable', language, date, routeId, pattern?.id),
    enabled: !!routeId && !!pattern?.id,
    staleTime: 300_000,
    retry: 1,
    queryFn: async ({ signal }) => {
      if (!routeId || !pattern?.id) return null;
      const transit = getTransit(signal, language);
      let tripId = pattern.vehiclePositions
        ?.map((position) => position.trip?.gtfsId || position.trip?.id)
        .find(Boolean);
      if (!tripId) {
        const patterns = await transit.routePatternTrips(routeId, date.replaceAll('-', ''));
        const trips = patterns.find((item) => item.id === pattern.id)?.tripsForDate ?? [];
        tripId = trips.find((trip) => trip.id)?.id ?? undefined;
      }
      if (!tripId) return null;
      const trip = await transit.trip(tripId, date);
      if (!trip) return null;
      return routeTimings(pattern.stops ?? [], trip.stoptimes ?? []);
    },
  });
}
