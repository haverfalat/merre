import { useQuery } from '@tanstack/react-query';
import { stopDetailOptions } from '@/lib/transit/detail-queries';
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
    ...stopDetailOptions(language, stopId, startTime, timeRange, timetable),
    enabled: !!stopId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
