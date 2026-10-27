import { useQuery } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '~/lib/transit/service';
import { usePlannerStore } from '~/store/usePlannerStore';
import { useUIStore } from '~/store/useUIStore';

export function useJourneyPlan() {
  const request = usePlannerStore((state) => state.request);
  const revision = usePlannerStore((state) => state.requestRevision);
  const open = usePlannerStore((state) => state.open);
  const language = useUIStore((state) => state.language);
  return useQuery({
    queryKey: transitQueryKey('journey-plan', language, request, revision),
    queryFn: ({ signal }) => getTransit(signal, language).plan(request!),
    enabled: open && !!request,
    staleTime: 30_000,
    refetchOnReconnect: false,
  });
}
