import { useDebouncedValue } from './useDebouncedValue';
import { useGeocode } from './useGeocode';
import { useStationSearch } from './useStationSearch';

/** Share debouncing and hide outdated place results while the user types. */
export function usePlaceSearch(input: string, enabled = true, stationQuery?: string) {
  const value = input.trim();
  const debounced = useDebouncedValue(value);
  const pending = enabled && value !== debounced;
  const query = enabled && !pending ? debounced : '';
  const stations = useStationSearch(stationQuery || query);
  const places = useGeocode(query);
  return {
    query,
    stations,
    places,
    searching: pending || stations.isLoading || places.isLoading,
  };
}
