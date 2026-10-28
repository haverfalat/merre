import { useQuery } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useUIStore } from '@/store/useUIStore';

interface UseStopDetailOptions {
  timetable?: boolean;
  startTime?: number;
  timeRange?: number;
}

export function useStopDetail(stopId: string | null, options?: UseStopDetailOptions) {
  const language = useUIStore((state) => state.language);
  const startTime = options?.startTime;
  const timeRange = options?.timeRange ?? 86400;
  const timetable = options?.timetable ?? false;
  return useQuery({
    queryKey: transitQueryKey('stop-detail', language, stopId, startTime, timeRange, timetable),
    queryFn: ({ signal }) => stopId
      ? getTransit(signal, language).stop(stopId, { startTime, timeRange, timetable })
      : null,
    enabled: !!stopId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
