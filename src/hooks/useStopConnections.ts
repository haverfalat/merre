import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useUIStore } from '@/store/useUIStore';
import type { StopConnectionsResponse } from '@/lib/transit/types/connections';
import { mergeStopConnections } from '@/lib/stop-groups';
import { useSelectedStopIds } from './useSelectedStopIds';

function combine(queries: UseQueryResult<StopConnectionsResponse | null>[]) {
  const data = mergeStopConnections(queries.flatMap((query) => (query.data ? [query.data] : [])));
  return {
    data,
    isPending: !data && queries.some((query) => query.isPending),
    isError: queries.some((query) => query.isError),
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}

export function useStopConnections(stopId: string | null, enabled: boolean) {
  const language = useUIStore((s) => s.language);
  const ids = useSelectedStopIds(stopId);
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: transitQueryKey('stop-connections', language, id, 2),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getTransit(signal, language).stopConnections(id),
      enabled,
      staleTime: 300_000,
      gcTime: 600_000,
    })),
    combine,
  });
}
