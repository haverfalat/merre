import { serviceDate } from './utils/service-time';
import type { ClientCore } from './core';
import { ROUTE_QUERY, ROUTE_PATTERN_TRIPS_QUERY } from './queries';
import type { RouteDetail, RouteTripRef } from '../types/route';
import type { ISODate } from '../types/common';

export interface RouteOptions {
  /** Service day used for alerts and the departure list (`YYYYMMDD` or `YYYY-MM-DD`). Defaults to today. */
  serviceDay?: ISODate;
  language?: string;
}

/** Route detail: patterns, stops, trips running today and live vehicles. */
export function createRouteApi(core: ClientCore) {
  /**
   * Full detail of a route (all patterns, stops, trips running on the given
   * service day, alerts and live vehicle positions).
   *
   * @example
   * await futar.route('1:V2955_106');
   */
  async function route(id: string, options: RouteOptions = {}): Promise<RouteDetail> {
    const compactDate = serviceDate(Date.now()).replaceAll('-', '');

    const variables: Record<string, unknown> = {
      id,
      serviceDay: options.serviceDay ?? compactDate,
      language: options.language ?? core.language,
    };
    const res = await core.graphql<{ route: RouteDetail }>(ROUTE_QUERY, variables, 'Route');
    return res.data!.route;
  }

  async function routePatternTrips(id: string, serviceDay: string) {
    const res = await core.graphql<{
      route: { patterns: { id: string | null; tripsForDate: RouteTripRef[] | null }[] } | null;
    }>(ROUTE_PATTERN_TRIPS_QUERY, { id, serviceDay }, 'RoutePatternTrips');
    return res.data!.route?.patterns ?? [];
  }
  return { route, routePatternTrips };
}

export type RouteApi = ReturnType<typeof createRouteApi>;
