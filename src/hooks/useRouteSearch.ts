import { useQuery } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useUIStore } from '@/store/useUIStore';
import type { RouteSummary } from '@/lib/transit/types/route';

export function useAllRoutes(enabled = true) {
  const language = useUIStore((state) => state.language);
  return useQuery<RouteSummary[]>({
    queryKey: transitQueryKey('all-routes', language),
    queryFn: async ({ signal }) => {
      const transit = getTransit(signal, language);
      return await transit.routes(['hu']);
    },
    enabled,
    staleTime: 3_600_000,
    gcTime: 3_600_000,
  });
}
