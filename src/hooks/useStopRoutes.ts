import { useQuery } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useUIStore } from '@/store/useUIStore';
import { LIVE_QUERY_OPTIONS } from '@/lib/live-query';

export function useStopRoutes(stopId: string | null) {
  const language = useUIStore((state) => state.language);
  return useQuery({
    queryKey: transitQueryKey('stop-routes', language, stopId, 2),
    queryFn: ({ signal }) => stopId ? getTransit(signal, language).stopRoutes(stopId) : null,
    enabled: !!stopId,
    ...LIVE_QUERY_OPTIONS,
  });
}
