import type { QueryClient } from '@tanstack/react-query';
import type { StopDetail } from './types/stop';
import type { TripDetail } from './types/trip';

/**
 * Patch cached stop-detail boards with fresher realtime timings from a viewed trip
 * so navigating back to a stop list immediately reflects the latest state.
 */
export function syncStopBoardFromTrip(
  queryClient: QueryClient,
  trip: TripDetail | null | undefined,
) {
  const tripId = trip?.id;
  const stoptimes = trip?.stoptimes;
  if (!tripId || !stoptimes?.length) return;
  const byStop = new Map(
    stoptimes
      .map((st) => [st.stop.gtfsId || st.stop.id || '', st] as const)
      .filter(([stopId]) => !!stopId),
  );
  if (!byStop.size) return;

  for (const [queryKey, data] of queryClient.getQueriesData<StopDetail | null>({
    queryKey: ['stop-detail'],
  })) {
    if (!data?.stopTimes?.length) continue;
    let changed = false;
    const stopTimes = data.stopTimes.map((group) => {
      let groupChanged = false;
      const times = group.times.map((time) => {
        const id = time.trip?.gtfsId || time.trip?.id;
        if (id !== tripId) return time;
        const stopId = time.stop?.gtfsId || time.stop?.id || data.gtfsId || data.id || '';
        const fresh = byStop.get(stopId);
        if (!fresh) return time;
        if (
          time.realtime === fresh.realtime &&
          time.realtimeState === fresh.realtimeState &&
          time.realtimeArrival === fresh.realtimeArrival &&
          time.realtimeDeparture === fresh.realtimeDeparture &&
          time.arrivalDelay === fresh.arrivalDelay &&
          time.departureDelay === fresh.departureDelay
        ) {
          return time;
        }
        changed = true;
        groupChanged = true;
        return {
          ...time,
          realtime: fresh.realtime,
          realtimeState: fresh.realtimeState,
          realtimeArrival: fresh.realtimeArrival,
          realtimeDeparture: fresh.realtimeDeparture,
          arrivalDelay: fresh.arrivalDelay,
          departureDelay: fresh.departureDelay,
        };
      });
      return groupChanged ? { ...group, times } : group;
    });
    if (changed) {
      queryClient.setQueryData(queryKey, { ...data, stopTimes });
    }
  }
}
