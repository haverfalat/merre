import { useQueries } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { useUIStore } from '@/store/useUIStore';
import type { RouteSummary } from '@/lib/transit/types/route';
import { filterRoutes } from '@/lib/transit/search/routes';

export function useRouteTerminals(routes: RouteSummary[] | undefined, query: string) {
  const language = useUIStore((s) => s.language);
  const candidates = filterRoutes(routes, query, 8).filter((r) => !r.longName || r.longName === r.id);
  const results = useQueries({ queries: candidates.map((route) => ({
    queryKey: transitQueryKey('route-terminals', language, route.id),
    queryFn: ({ signal }: { signal: AbortSignal }) => getTransit(signal, language).routeTerminals(route.id),
    staleTime: 3_600_000,
  })) });
  return new Map(candidates.map((route, index) => [route.id, results[index].data]));
}
