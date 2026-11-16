import { useNow } from './useNow';
import { useQuery } from '@tanstack/react-query';
import { routeDetailOptions } from '@/lib/transit/detail-queries';
import { serviceDate } from '@/lib/transit';
import { useUIStore } from '@/store/useUIStore';
import { LIVE_QUERY_OPTIONS } from '@/lib/live-query';

export function useRouteDetail(routeId: string | null) {
  const date = serviceDate(useNow()).replaceAll('-', '');
  const language = useUIStore((state) => state.language);
  return useQuery({
    ...routeDetailOptions(language, routeId, date),
    enabled: !!routeId,
    ...LIVE_QUERY_OPTIONS,
  });
}
