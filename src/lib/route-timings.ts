import type { Stop } from './transit/types/stop';
import type { TripStopTime } from './transit/types/trip';

export function routeTimings(stops: Stop[], times: TripStopTime[]) {
  let cursor = 0;
  const matched = stops.map((stop) => {
    const id = stop.gtfsId || stop.id;
    const index = times.findIndex(
      (time, i) => i >= cursor && id && (time.stop.gtfsId || time.stop.id) === id,
    );
    if (index < 0) return null;
    cursor = index + 1;
    return times[index];
  });
  const finite = (value: number | null | undefined) =>
    value != null && Number.isFinite(value) ? value : null;
  const start = finite(matched[0]?.scheduledDeparture ?? matched[0]?.scheduledArrival);
  const rows = matched.map((time, index) => {
    const arrival = finite(
      index === 0
        ? (time?.scheduledDeparture ?? time?.scheduledArrival)
        : (time?.scheduledArrival ?? time?.scheduledDeparture),
    );
    const previous = finite(
      matched[index - 1]?.scheduledDeparture ?? matched[index - 1]?.scheduledArrival,
    );
    return {
      elapsedMinutes:
        start != null && arrival != null && arrival >= start
          ? Math.round((arrival - start) / 60)
          : null,
      segmentMinutes:
        previous != null && arrival != null && arrival >= previous
          ? Math.round((arrival - previous) / 60)
          : null,
    };
  });
  return { rows, totalMinutes: rows.at(-1)?.elapsedMinutes ?? null };
}
