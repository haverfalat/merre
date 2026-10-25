import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useGeocode } from '@/hooks/useGeocode';
import { useNow } from '@/hooks/useNow';
import { useAllRoutes } from '@/hooks/useRouteSearch';
import { useStationGroups } from '@/hooks/useStationGroups';
import { useStationSearch } from '@/hooks/useStationSearch';
import { useStopsInBounds } from '@/hooks/useStopsInBounds';
import { useTranslation } from '@/hooks/useTranslation';
import { useTripSearch } from '@/hooks/useTripSearch';
import { useVehiclesInBounds } from '@/hooks/useVehiclesInBounds';
import { serviceDate } from '@/lib/transit';
import { useMapStore } from '@/store/useMapStore';
import { useMemo } from 'react';
import { buildSearchResults } from './search-results';

export function useTransitSearch(input: string, enabled: boolean) {
  const { language, t } = useTranslation();
  const debounced = useDebouncedValue(input.trim());
  const query = enabled && input.trim() === debounced ? debounced : '';
  const stations = useStationSearch(query);
  const trips = useTripSearch(query);
  const places = useGeocode(query);
  const routes = useAllRoutes(!!query);
  const groups = useStationGroups(stations.data?.features, language, !!query);
  const vehicles = useVehiclesInBounds();
  const stops = useStopsInBounds();
  const bounds = useMapStore((s) => s.bbox);
  const center = useMapStore((s) => s.center);
  const date = serviceDate(useNow());
  const results = useMemo(
    () =>
      buildSearchResults({
        actions: useMapStore.getState(),
        query,
        stations: stations.data,
        trips: trips.data,
        places: places.data,
        routes: routes.data,
        groups,
        stops: stops.data,
        vehicles: vehicles.data,
        bounds,
        center,
        date,
        t,
      }),
    [
      query,
      stations.data,
      trips.data,
      places.data,
      routes.data,
      groups,
      stops.data,
      vehicles.data,
      bounds,
      center,
      date,
      t,
    ],
  );
  const sources = [stations, trips, places, routes];
  return {
    results,
    searching: input.trim() !== debounced || sources.some((q) => q.isLoading),
    failed: sources.some((q) => q.isError),
    retry: () => {
      for (const q of sources) if (q.isError) void q.refetch();
    },
  };
}
