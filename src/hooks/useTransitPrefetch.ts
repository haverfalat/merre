import { onlineManager, useQueryClient, type FetchQueryOptions, type QueryKey } from '@tanstack/react-query';
import { useCallback } from 'react';
import { serviceDate } from '~/lib/transit';
import { routeDetailOptions, stopDetailOptions, stopRoutesOptions, tripDetailOptions } from '~/lib/transit/detail-queries';
import { useUIStore } from '~/store/useUIStore';

export type TransitIntent = { kind: 'stop' | 'route' | 'trip'; id: string; day?: string; routesOnly?: boolean };
const panelLoads = new Map<TransitIntent['kind'], Promise<unknown>>();
function warmPanel(kind: TransitIntent['kind']) {
  if (panelLoads.has(kind)) return;
  const load = kind === 'stop' ? import('~/features/stops/StopPanel')
    : kind === 'trip' ? import('~/features/trips/TripPanel') : import('~/features/routes/RoutePanel');
  panelLoads.set(kind, load);
  void load.catch(() => { panelLoads.delete(kind); });
}

// Intent requests share the screen's cache and cancellation, with bounded background work.
const queued = new Map<string, () => Promise<unknown>>();
const running = new Set<string>();
let active = 0;
function drain() {
  while (active < 2 && queued.size) {
    const [key, run] = queued.entries().next().value!;
    queued.delete(key);
    if (!onlineManager.isOnline()) continue;
    active++;
    running.add(key);
    void run().catch(() => {}).finally(() => { active--; running.delete(key); drain(); });
  }
}
export function useTransitPrefetch() {
  const cache = useQueryClient();
  return useCallback((intent?: TransitIntent) => {
    if (!intent?.id || !onlineManager.isOnline()) return;
    if (typeof navigator !== 'undefined' &&
        (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
    warmPanel(intent.kind);
    const language = useUIStore.getState().language;
    const add = <T, K extends QueryKey>(options: FetchQueryOptions<T, Error, T, K>) => {
      const key = JSON.stringify(options.queryKey);
      if (running.has(key) || queued.has(key) || queued.size >= 12) return;
      queued.set(key, () => cache.prefetchQuery({ ...options, retry: false }));
    };
    if (intent.kind === 'stop') {
      if (!intent.routesOnly) add(stopDetailOptions(language, intent.id));
      add(stopRoutesOptions(language, intent.id));
    } else if (intent.kind === 'trip') add(tripDetailOptions(language, intent.id, intent.day));
    else add(routeDetailOptions(language, intent.id, serviceDate(Date.now()).replaceAll('-', '')));
    drain();
  }, [cache]);
}
