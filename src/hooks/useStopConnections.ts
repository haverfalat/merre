import { useQuery } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useUIStore } from '@/store/useUIStore';

export function useStopConnections(stopId: string | null, enabled: boolean) {
  const language = useUIStore((s) => s.language);
  return useQuery({
    queryKey: transitQueryKey('stop-connections', language, stopId, 2),
    queryFn: ({ signal }) => stopId ? getTransit(signal, language).stopConnections(stopId) : null,
    enabled: enabled && !!stopId,
    staleTime: 300_000,
    gcTime: 600_000,
  });
}
