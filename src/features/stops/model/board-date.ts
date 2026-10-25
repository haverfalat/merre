import { serviceDate, TRANSIT_TIME_ZONE } from '@/lib/transit';
import type { ReactNode } from 'react';

export function boardDateOffset(date: string, now: number) {
  return Math.round(
    (Date.parse(`${date}T12:00:00Z`) - Date.parse(`${serviceDate(now)}T12:00:00Z`)) / 86400000,
  );
}

/** Resolve the chosen Budapest wall-clock time, including daylight saving. */
export function boardTimeEpoch(date: string, time: string) {
  const target = Date.parse(`${date}T${time}:00Z`);
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: TRANSIT_TIME_ZONE,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  let epoch = target;
  for (let i = 0; i < 3; i++) {
    const local = Date.parse(`${serviceDate(epoch)}T${clock.format(epoch)}Z`);
    epoch += target - local;
  }
  return epoch / 1000;
}

export interface BoardDateInputProps {
  date: string;
  time: string;
  minimum: string;
  maximum: string;
  dateLabel?: string;
  afterDate?: ReactNode;
  onDate: (date: string) => void;
  onTime: (time: string) => void;
}
