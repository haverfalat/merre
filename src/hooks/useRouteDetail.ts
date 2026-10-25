import { useNow } from './useNow';
import { useQuery } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { serviceDate } from '@/lib/transit';
import { useUIStore } from '@/store/useUIStore';
import { LIVE_QUERY_OPTIONS } from '@/lib/live-query';

export function useRouteDetail(routeId: string | null) {
  const date = serviceDate(useNow()).replaceAll('-', '');
  const language = useUIStore((state) => state.language);
  return useQuery({
    queryKey: transitQueryKey('route-detail', language, date, routeId),
    queryFn: ({ signal }) =>
      routeId
        ? getTransit(signal, language).route(routeId, {
            serviceDay: date,
          })
        : null,
    enabled: !!routeId,
    ...LIVE_QUERY_OPTIONS,
  });
}
