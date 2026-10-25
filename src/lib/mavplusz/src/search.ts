import { serviceDate } from './utils/service-time';
import type { ClientCore } from './core';
import { SEARCH_TRIPS_QUERY } from './queries';
import type { SearchTripSummary, SearchTripsRequest } from '../types/geo';

/** Trip search API. */
export function createSearchApi(core: ClientCore) {
  /**
   * Search for trips by name, number or route text.
   *
   * @example
   * const results = await futar.searchTrips({ searchString: 'InterCity', modes: ['RAIL'] });
   */
  async function searchTrips(request: SearchTripsRequest): Promise<SearchTripSummary[]> {
    const defaultDate = serviceDate(Date.now());
    const variables: Record<string, unknown> = {
      searchString: request.searchString,
      modes: request.modes ?? null,
      agencyIds: request.agencyIds ?? null,
      countryIsoCodes: request.countryIsoCodes ?? null,
      date: request.date ?? defaultDate,
    };
    const res = await core.graphql<{ searchTrips: SearchTripSummary[] }>(
      SEARCH_TRIPS_QUERY,
      variables,
      'SearchTrips',
    );
    return res.data!.searchTrips;
  }

  return { searchTrips };
}

export type SearchApi = ReturnType<typeof createSearchApi>;
