import type { Stoptime } from './types/stop';

export type StopTimeDirection = 'departures' | 'arrivals';

/** Arrival and departure estimates can differ, including at a terminating station. */
export function stopTiming(time: Stoptime, direction: StopTimeDirection) {
  const scheduled = direction === 'arrivals' ? time.scheduledArrival : time.scheduledDeparture;
  const estimated = direction === 'arrivals' ? time.realtimeArrival : time.realtimeDeparture;
  const live = time.realtime === true && estimated != null;
  const seconds = live ? estimated : scheduled;
  const delay = live
    ? ((direction === 'arrivals' ? time.arrivalDelay : time.departureDelay) ??
      (scheduled != null ? estimated - scheduled : null))
    : null;
  return {
    live,
    seconds,
    delay,
    epoch: time.serviceDay != null && seconds != null ? time.serviceDay + seconds : null,
  };
}

/** Identify a service visit by its scheduled time, even when predictions change. */
export function stopTimeKey(time: Stoptime) {
  return JSON.stringify([
    time.trip?.gtfsId || time.trip?.id || '',
    time.serviceDay,
    time.scheduledDeparture ?? time.scheduledArrival ?? time.realtimeDeparture ?? time.realtimeArrival,
    time.stop?.gtfsId || time.stop?.id || '',
  ]);
}
