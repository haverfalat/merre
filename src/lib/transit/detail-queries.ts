import { queryOptions } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from './service';
import { LIVE_QUERY_OPTIONS } from '../live-query';

type Language = 'en' | 'hu';
export function stopDetailOptions(language: Language, id: string | null, startTime?: number, timeRange = 86400, timetable = false) {
  return queryOptions({
    queryKey: transitQueryKey('stop-detail', language, id, startTime, timeRange, timetable),
    queryFn: ({ signal }) => id ? getTransit(signal, language).stop(id, { startTime, timeRange, timetable }) : null,
    staleTime: 30_000,
  });
}
export function stopRoutesOptions(language: Language, id: string | null) {
  return queryOptions({
    queryKey: transitQueryKey('stop-routes', language, id, 2),
    queryFn: ({ signal }) => id ? getTransit(signal, language).stopRoutes(id) : null,
    ...LIVE_QUERY_OPTIONS,
  });
}
export function tripDetailOptions(language: Language, id: string | null, day?: string) {
  const date = day?.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
  return queryOptions({
    queryKey: transitQueryKey('trip-detail', language, id, date),
    queryFn: ({ signal }) => id ? getTransit(signal, language).trip(id, date) : null,
    ...LIVE_QUERY_OPTIONS,
  });
}
export function routeDetailOptions(language: Language, id: string | null, date: string) {
  return queryOptions({
    queryKey: transitQueryKey('route-detail', language, date, id),
    queryFn: ({ signal }) => id ? getTransit(signal, language).route(id, { serviceDay: date }) : null,
    ...LIVE_QUERY_OPTIONS,
  });
}
