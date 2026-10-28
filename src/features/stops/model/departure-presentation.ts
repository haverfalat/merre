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
  const formattedDelay = formatDelay(delay);
  // Proximity never overrides the reported delay, including while showing "now".
  const tone = canceled
    ? 'danger'
    : minutes != null && minutes < 0
      ? 'muted'
      : !live
        ? 'secondary'
        : formattedDelay.status === 'major_delay'
          ? 'danger'
          : formattedDelay.status === 'minor_delay'
            ? 'warning'
            : formattedDelay.status === 'early'
              ? 'early'
              : 'success';
  const surface =
    tone === 'danger'
      ? 'dangerMuted'
      : tone === 'warning'
        ? 'warningMuted'
        : tone === 'early'
          ? 'earlyMuted'
          : tone === 'success'
            ? 'successMuted'
            : 'surface';
  return {
    canceled,
    live,
    minutes,
    epoch,
    delaySeconds: delay,
    delay: formattedDelay,
    tone,
    surface,
    time: formatTimeOfDay(seconds) || '--:--',
    showCountdown: minutes != null && minutes <= 60,
  } as const;
}
