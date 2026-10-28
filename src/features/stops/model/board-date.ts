import { serviceDate } from '@/lib/transit';

export function boardDateOffset(date: string, now: number) {
  return Math.round(
    (Date.parse(`${date}T12:00:00Z`) - Date.parse(`${serviceDate(now)}T12:00:00Z`)) / 86400000,
  );
}

export { dateTimeEpoch as boardTimeEpoch } from '~/lib/transit/time/service-day';
