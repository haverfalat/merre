import { useQueries } from '@tanstack/react-query';
import { useExactTripPositions } from './useExactTripPositions';
import { isPlateQuery } from '@/lib/transit/search/plates';
import { matchCompoundRouteStops, parseCompoundRouteQuery } from '@/lib/transit/search/compound';
import { routeDetailOptions } from '@/lib/transit/detail-queries';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePlateSearch } from '@/hooks/usePlateSearch';
import { useRouteTerminals } from '@/hooks/useRouteTerminals';
import { uniqueVehiclePositions } from '@/lib/vehicle-position';
import { usePlaceSearch } from '@/hooks/usePlaceSearch';
import { useNow } from '@/hooks/useNow';
import { useAllRoutes } from '@/hooks/useRouteSearch';
import { useStationGroups } from '@/hooks/useStationGroups';
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
  const debouncedInput = useDebouncedValue(input.trim());
  const routes = useAllRoutes(enabled && !!debouncedInput);
  const compound = useMemo(
    () => parseCompoundRouteQuery(debouncedInput, routes.data),
    [debouncedInput, routes.data],
  );
  const { query, stations, places, searching } = usePlaceSearch(
    input,
    enabled,
    compound?.restTokens[0],
  );
  const trips = useTripSearch(query);
  const plateVehicles = usePlateSearch(query);
  const terminals = useRouteTerminals(routes.data, query);
  const groups = useStationGroups(stations.data?.features, language, !!query);
  const vehicles = useVehiclesInBounds();
  const stops = useStopsInBounds();
  const bounds = useMapStore((s) => s.bbox);
  const center = useMapStore((s) => s.center);
  const now = useNow();
  const date = serviceDate(now);
  const compactDate = date.replaceAll('-', '');
  const compoundRouteQueries = useQueries({
    queries: (compound?.routes ?? []).map((route) => ({
      ...routeDetailOptions(language, route.id, compactDate),
      enabled: enabled && !!compound,
    })),
  });
  const compoundMatches = useMemo(
    () =>
      compound
        ? matchCompoundRouteStops(
            compoundRouteQueries.map((q) => q.data),
            compound.restTokens,
          )
        : [],
    [compound, compoundRouteQueries],
  );
  const exactPositions = useExactTripPositions(query, trips.data, date, language, enabled);
  const results = useMemo(
    () =>
      buildSearchResults({
        actions: useMapStore.getState(),
        query,
        now,
        exactPositions,
        compoundMatches,
        stations: stations.data,
        trips: trips.data,
        places: places.data,
        routes: routes.data,
        terminals,
        groups,
        stops: stops.data,
        vehicles: uniqueVehiclePositions([...(vehicles.data ?? []), ...(isPlateQuery(query) ? plateVehicles.data ?? [] : [])]),
        bounds,
        center,
        date,
        t,
      }),
    [
      query,
      compoundMatches,
      stations.data,
      trips.data,
      places.data,
      routes.data,
      terminals,
      plateVehicles.data,
      groups,
      stops.data,
      vehicles.data,
      bounds,
      center,
      date,
      now,
      exactPositions,
      t,
    ],
  );
  const sources = [
    stations,
    trips,
    places,
    routes,
    ...compoundRouteQueries,
    ...(isPlateQuery(query) ? [plateVehicles] : []),
  ];
  return {
    results,
    searching: searching || sources.some((q) => q.isLoading),
    failed: !!query && sources.some((q) => q.isError),
    retry: () => {
      for (const q of sources) if (q.isError) void q.refetch();
    },
  };
}
