import { useQuery } from '@tanstack/react-query';
import { stopRoutesOptions } from '@/lib/transit/detail-queries';
import { useUIStore } from '@/store/useUIStore';

export function useStopRoutes(stopId: string | null) {
  const language = useUIStore((state) => state.language);
  return useQuery({
    ...stopRoutesOptions(language, stopId),
    enabled: !!stopId,
  });
}
