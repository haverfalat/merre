import type { TripDetail, TripStopTime } from '@/lib/transit/types/trip';

export interface TripTimelineItem {
  key: string;
  stop: {
    id?: string | null;
    gtfsId?: string | null;
    name?: string | null;
    lat?: number | null;
    lon?: number | null;
    platformCode?: string | null;
  };
  time: TripStopTime | null;
}
export function tripTimelineItems(trip: TripDetail | null | undefined): TripTimelineItem[] {
  return trip?.stoptimes?.length
    ? trip.stoptimes.map((time, index) => ({
        key: `${time.stop.gtfsId || time.stop.id}-${index}`,
        stop: time.stop,
        time,
      }))
    : (trip?.pattern?.stops ?? []).map((stop, index) => ({
        key: `${stop.id}-${index}`,
        stop,
        time: null,
      }));
}
