import { useQueries, queryOptions } from '@tanstack/react-query';
import { getTransit, transitQueryKey } from '@/lib/transit/service';
import { samePlaceStops } from '@/lib/stop-groups';
import { validCoordinates } from '@/lib/transit';
import type { StationSearchResult } from '@/lib/transit/types/geo';

type Station = StationSearchResult['features'][number];

function stationGroupOptions(station: Station, language: 'hu' | 'en') {
  const [lon, lat] = station.geometry.coordinates;
  return queryOptions({
    queryKey: transitQueryKey('station-group', language, station.id),
    queryFn: async ({ signal }) =>
      samePlaceStops(
        await getTransit(signal, language).stopsByRadius(lat, lon, 250),
        station.properties.name,
      ),
    staleTime: 300_000,
    gcTime: 600_000,
  });
}

export function useStationGroups(
  stations: Station[] | undefined,
  language: 'hu' | 'en',
  enabled: boolean,
) {
  const candidates = (stations ?? [])
    .filter(
      (station) =>
        station.properties.type !== 'MetaStation' &&
        validCoordinates(...station.geometry.coordinates),
    )
    .slice(0, 8);
  const queries = useQueries({
    queries: candidates.map((station) => ({ ...stationGroupOptions(station, language), enabled })),
  });
  return new Map(candidates.map((station, index) => [station.id, queries[index].data]));
}
