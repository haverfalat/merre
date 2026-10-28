import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useUIStore } from '@/store/useUIStore';
import { mergeStopDetails } from '@/lib/stop-groups';
import type { StopDetail } from '@/lib/transit/types/stop';
import { useSelectedStopIds } from './useSelectedStopIds';

interface UseStopDetailOptions {
  timetable?: boolean;
  startTime?: number;
  timeRange?: number;
}

function combine(queries: UseQueryResult<StopDetail | null>[]) {
  const data = mergeStopDetails(queries.flatMap((query) => (query.data ? [query.data] : [])));
  return {
    data,
    isError: queries.some((query) => query.isError),
    isPending: !data && queries.some((query) => query.isPending),
    isFetching: queries.some((query) => query.isFetching),
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}

export function useStopDetail(stopId: string | null, options?: UseStopDetailOptions) {
  const language = useUIStore((state) => state.language);
  const ids = useSelectedStopIds(stopId);
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: transitQueryKey(
        'stop-detail',
        language,
        id,
        options?.startTime,
        options?.timeRange,
        options?.timetable,
      ),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getTransit(signal, language).stop(id, {
          startTime: options?.startTime,
          timeRange: options?.timeRange ?? 86400,
          timetable: options?.timetable,
        }),
      staleTime: 30_000,
      refetchInterval: 30_000,
    })),
    combine,
  });
}
