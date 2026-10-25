import type { Departure } from '@/lib/stop-departures';
import { formatDelay } from '@/lib/transit/delay';
import { formatTimeOfDay } from '@/lib/transit/time/format';
import { boardTiming, type BoardDirection } from '~/features/stops/model/station-board-model';

export function departurePresentation(
  dep: Departure,
  now: number,
  direction: BoardDirection = 'departures',
) {
  const canceled = dep.realtimeState === 'CANCELED' || dep.realtimeState === 'SKIPPED';
  const { live, seconds, delay, epoch } = boardTiming(dep, direction);
  const minutes = epoch != null ? Math.ceil((epoch - now / 1000) / 60) : null;
  return {
    canceled,
    live,
    minutes,
    delay: formatDelay(delay),
    time: formatTimeOfDay(seconds) || '--:--',
    showCountdown: minutes != null && minutes <= 60,
  };
}
