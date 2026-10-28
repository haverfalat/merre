import { TRANSIT_TIME_ZONE } from '../transit/time/service-day';

const formatters = new Map<string, Intl.DateTimeFormat>();

/** Offset-free provider dates are Hungarian wall times; UTC dates carry an offset. */
export function formatTicketDate(value: string, language: 'hu' | 'en'): string {
  const local = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value);
  const date = new Date(local ? `${value.replace(' ', 'T')}Z` : value);
  if (!Number.isFinite(date.getTime())) return value;
  const key = `${language}-${local}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(language === 'hu' ? 'hu-HU' : 'en-GB', {
      timeZone: local ? 'UTC' : TRANSIT_TIME_ZONE,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    formatters.set(key, formatter);
  }
  return formatter.format(date);
}
