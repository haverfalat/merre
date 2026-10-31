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
        const trips = patterns.filter(item => item.id === pattern.id ||
          (!!item.id && pattern.tripPatternIds?.includes(item.id))).flatMap(item => item.tripsForDate ?? []);
        tripId = trips.find((trip) => trip.id)?.id ?? undefined;
      }
      if (!tripId) return null;
      const trip = await transit.trip(tripId, date);
      if (!trip) return null;
      // A reference diagram can span a trip boundary or include a different
      // branch. Never present one trip's timings as the full reference route.
      if (pattern.reference) {
        const stops = pattern.stops ?? [];
        const times = trip.stoptimes ?? [];
        if (stops.length !== times.length || stops.some((stop, index) =>
          (stop.gtfsId || stop.id) !== (times[index].stop.gtfsId || times[index].stop.id))) return null;
      }
      return routeTimings(pattern.stops ?? [], trip.stoptimes ?? []);
    },
  });
}
