export const TRANSIT_TIME_ZONE = 'Europe/Budapest';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TRANSIT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const clockFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TRANSIT_TIME_ZONE,
  hourCycle: 'h23',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export function serviceDate(epochMs: number): string {
  const parts = dateFormatter.formatToParts(epochMs);
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function serviceDayBounds(now: number, offset = 0) {
  const day = new Date(`${serviceDate(now)}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() + offset);
  const date = day.toISOString().slice(0, 10);
  day.setUTCDate(day.getUTCDate() + 1);
  return {
    date,
    start: dateTimeEpoch(date, '00:00'),
    end: dateTimeEpoch(day.toISOString().slice(0, 10), '00:00'),
  };
}

/** Resolve the chosen Budapest wall-clock time, including daylight saving. */
export function dateTimeEpoch(date: string, time: string) {
  const target = Date.parse(`${date}T${time}:00Z`);
  let epoch = target;
  for (let i = 0; i < 3; i++) {
    const local = Date.parse(`${serviceDate(epoch)}T${clockFormatter.format(epoch)}Z`);
    epoch += target - local;
  }
  return epoch / 1000;
}
