import type { Departure } from '@/lib/stop-departures';
import { boardTiming } from '~/features/stops/model/station-board-model';

export function timetableHours(departures: Departure[]) {
  const hours = new Map<number, { hour: number; departures: Departure[] }>();
  for (const departure of [...departures].sort(
    (a, b) =>
      (boardTiming(a, 'departures').epoch ?? Infinity) -
      (boardTiming(b, 'departures').epoch ?? Infinity),
  )) {
    const epoch = boardTiming(departure, 'departures').epoch;
    if (epoch == null) continue;
    const hour = Math.floor(epoch / 3600);
    const row = hours.get(hour) ?? { hour, departures: [] };
    row.departures.push(departure);
    hours.set(hour, row);
  }
  return [...hours.values()];
}
