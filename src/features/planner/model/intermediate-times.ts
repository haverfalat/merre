import type { JourneyLeg, JourneyPlace } from '~/lib/transit/types/plan';
import type { TripDetail, TripStopTime } from '~/lib/transit/types/trip';

function sameStop(point: JourneyPlace, stop: TripStopTime['stop']) {
  const ids = [stop.id, stop.gtfsId, stop.stopId].filter(Boolean);
  if (point.stopId && ids.length) return ids.includes(point.stopId);
  if (point.lat != null && point.lon != null && stop.lat != null && stop.lon != null)
    return Math.abs(point.lat - stop.lat) < 0.0001 && Math.abs(point.lon - stop.lon) < 0.0001;
  return !!point.name && point.name === stop.name;
}

/** Match actual service visits in order. Missing times stay missing; never interpolate. */
export function intermediateTimes(leg: JourneyLeg, trip: TripDetail | null | undefined) {
  const times = trip?.stoptimes ?? [];
  // A service can visit the same stop more than once. Pick the boarding visit
  // closest to the itinerary's actual departure when the provider supplies dates.
  let from = -1;
  let nearest = Infinity;
  times.forEach((item, index) => {
    if (!sameStop(leg.from, item.stop)) return;
    const scheduled = item.scheduledDeparture ?? item.scheduledArrival;
    const estimated = item.realtimeDeparture ?? item.realtimeArrival;
    const seconds = item.realtime && estimated != null ? estimated : scheduled;
    const distance =
      item.serviceDay != null && seconds != null
        ? Math.abs((item.serviceDay + seconds) * 1000 - leg.startTime)
        : Infinity;
    if (from < 0 || distance < nearest) {
      from = index;
      nearest = distance;
    }
  });
  const end = times.findIndex((item, index) => index > from && sameStop(leg.to, item.stop));
  let cursor = from + 1;
  return leg.intermediateStops.map((stop) => {
    const index = times.findIndex(
      (item, index) => index >= cursor && (end < 0 || index < end) && sameStop(stop, item.stop),
    );
    if (index >= 0) cursor = index + 1;
    return { stop, timing: index >= 0 ? times[index] : undefined };
  });
}

export function intermediateEpoch(timing: TripStopTime | undefined) {
  const scheduled = timing?.scheduledArrival ?? timing?.scheduledDeparture;
  const estimated = timing?.realtimeArrival ?? timing?.realtimeDeparture;
  const seconds = timing?.realtime && estimated != null ? estimated : scheduled;
  return timing?.serviceDay != null && seconds != null
    ? (timing.serviceDay + seconds) * 1000
    : null;
}
