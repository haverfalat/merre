import { cleanTransitPlaceName } from '../../labels';
import { createMavPlusz } from '../../../mavplusz/src';
import type { TransitClient, TransitRequest } from '../../client';
import { boundsRadius, stopsWithinBounds } from '../../geometry/bounds';
import { transitResponse } from './errors';
import {
  normalizeConnections,
  normalizePattern,
  normalizeRoute,
  normalizeStop,
  normalizeStopRoutes,
  normalizeStops,
  normalizeTrip,
  normalizeVehicles,
} from './normalize';
import type { MavStopConnections } from './queries';
import { normalizePlan, normalizePlanOptions } from './plan';
import { STOP_CONNECTIONS_QUERY } from './queries';

export const MAVPLUSZ_BACKEND_ID = 'mavplusz';

let baseUrl = '/api/mav/proxy';

export function configureMavTransport(options: { baseUrl: string }) {
  baseUrl = options.baseUrl.replace(/\/+$/, '');
}

export function createMavTransitClient({ signal, language }: TransitRequest): TransitClient {
  const mav = createMavPlusz({
    baseUrl,
    language: language === 'hu' ? 'hu-HU' : 'en-US',
    timeout: 20_000,
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        signal: AbortSignal.any([signal, ...(init?.signal ? [init.signal] : []),
          ...(typeof init?.body === 'string' && (init.body.includes('GetVehiclePositionsForTrips') || init.body.includes('vehiclePositions('))
            ? [AbortSignal.timeout(4_000)] : []),
        ]),
      }),
  });
  const request = <T>(operation: () => Promise<T>) => transitResponse(signal, operation);
  return {
    backendId: MAVPLUSZ_BACKEND_ID,
    plan: (options) =>
      request(async () =>
        normalizePlan(
          await mav.plan({
            ...options,
            ...options.preferences,
            from: { ...options.from, gtfsId: options.from.stopId },
            to: { ...options.to, gtfsId: options.to.stopId },
            numItineraries: 6,
          }),
        ),
      ),
    planOptions: () =>
      request(async () => normalizePlanOptions(await mav.planParameters(), language)),
    stop: (id, options) => request(async () => normalizeStop(await mav.stop(id, options))),
    stopRoutes: (id) => request(async () => normalizeStopRoutes(await mav.stopRoutes(id))),
    stopConnections: (id) =>
      request(async () => {
        const response = await mav.graphql<{ stop: MavStopConnections | null }>(
          STOP_CONNECTIONS_QUERY,
          { id },
          'StopConnections',
        );
        return normalizeConnections(response.data?.stop ?? null);
      }),
    stopsByRadius: (lat, lon, radius) =>
      request(async () => normalizeStops(await mav.stopsByRadius(lat, lon, radius))),
    stopsInBounds: (bounds) =>
      request(async () => {
        const { lat, lon, radius } = boundsRadius(bounds);
        return stopsWithinBounds(normalizeStops(await mav.stopsByRadius(lat, lon, radius)), bounds);
      }),
    trip: (id, day) => request(async () => normalizeTrip(await mav.trip(id, day))),
    route: (id, options) => request(async () => normalizeRoute(await mav.route(id, options))),
    routeTerminals: (id) => request(async () => {
      const response = await mav.graphql<{ route: { patterns: { stops: { name: string }[] }[] } | null }>(
        `query RouteTerminals($id: String!) { route(id: $id) { patterns { stops { name } } } }`,
        { id }, 'RouteTerminals');
      const stops = response.data?.route?.patterns?.reduce<{ name: string }[]>(
        (longest, pattern) => pattern.stops.length > longest.length ? pattern.stops : longest, []);
      if (!stops?.length) return null;
      return [...new Set([cleanTransitPlaceName(stops[0].name), cleanTransitPlaceName(stops[stops.length - 1].name)])].join(' ↔ ');
    }),
    routePatternTrips: (id, day) =>
      request(async () => (await mav.routeApi.routePatternTrips(id, day)).map(normalizePattern)),
    vehiclePositionsForTrip: (id, serviceDay) =>
      request(async () => normalizeVehicles(await mav.vehiclePositionsForTrips([{ id, serviceDay }]))),
    vehiclesInBounds: (bounds, modes) =>
      request(async () => normalizeVehicles(await mav.vehiclesInBounds(bounds, modes))),
    geocodeStations: (query, options) =>
      request(async () => {
        const result = await mav.geocodeStations(query, options);
        return { ...result, features: result.features ?? [] };
      }),
    geocode: (query, options) =>
      request(async () => {
        const result = await mav.geocode(query, options);
        return { ...result, features: result.features ?? [] };
      }),
    routes: (countries) =>
      request(async () => ((await mav.routes(countries)) ?? []).map((route) => ({ ...route }))),
    searchTrips: (options) =>
      request(async () => ((await mav.searchTrips(options)) ?? []).map((trip) => ({ ...trip }))),
  };
}
