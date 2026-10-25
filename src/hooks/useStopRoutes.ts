import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useUIStore } from '@/store/useUIStore';
import { mergeStopRoutes } from '@/lib/stop-groups';
import type { StopRoutesResponse } from '@/lib/transit/types/stop';
import { useSelectedStopIds } from './useSelectedStopIds';
import { LIVE_QUERY_OPTIONS } from '@/lib/live-query';

function combine(queries: UseQueryResult<StopRoutesResponse | null>[]) {
  return {
    data: mergeStopRoutes(queries.flatMap((query) => (query.data ? [query.data] : []))),
    isError: queries.some((query) => query.isError),
  };
}

export function useStopRoutes(stopId: string | null) {
  const language = useUIStore((state) => state.language);
  const ids = useSelectedStopIds(stopId);
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: transitQueryKey('stop-routes', language, id, 2),
      queryFn: ({ signal }: { signal: AbortSignal }) => getTransit(signal, language).stopRoutes(id),
      ...LIVE_QUERY_OPTIONS,
    })),
    combine,
  });
}
