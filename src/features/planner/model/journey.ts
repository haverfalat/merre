import { serviceDate } from '~/lib/transit/time/service-day';
import { formatDuration } from '~/lib/transit/time/format';
import type { TranslationKey } from '~/i18n/dict';
import type { Journey, JourneyEndpoint } from '~/lib/transit/types/plan';

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;
export { formatServiceTime as journeyTime } from '~/lib/transit/time/format';
export const journeyDuration = (seconds: number, t: Translate) =>
  formatDuration(Math.ceil(seconds / 60), t);
export function dayOffset(start: number, end: number) {
  return Math.round((Date.parse(serviceDate(end)) - Date.parse(serviceDate(start))) / 86400000);
}
export function sameEndpoint(from: JourneyEndpoint | null, to: JourneyEndpoint | null) {
  return (
    !!from &&
    !!to &&
    ((!!from.stopId && from.stopId === to.stopId) ||
      (Math.abs(from.lat - to.lat) < 0.00001 && Math.abs(from.lon - to.lon) < 0.00001))
  );
}
export function journeyTransferLabel(journey: Journey, t: Translate) {
  if (!journey.legs.some((leg) => leg.transit)) return t('planner_walk_only');
  return journey.transfers
    ? t('planner_transfers', { count: journey.transfers })
    : t('planner_direct');
}

export function sortJourneys(
  journeys: Journey[],
  sort: 'departure' | 'arrival' | 'duration' | 'transfers',
) {
  return [...journeys].sort((a, b) =>
    sort === 'arrival'
      ? a.endTime - b.endTime
      : sort === 'duration'
        ? a.duration - b.duration
        : sort === 'transfers'
          ? a.transfers - b.transfers || a.duration - b.duration
          : a.startTime - b.startTime,
  );
}
