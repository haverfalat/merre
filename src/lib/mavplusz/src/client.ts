import type { GraphQLResponse, Mode, ISODate } from '../types/common';
import { HttpTransport } from './transport';
import type { ResolvedConfig, MavPluszOptions } from './config';
import { resolveConfig, graphqlPathFor } from './config';
import { MavPluszError, MavPluszGraphQLError } from './utils/errors';
import type { ClientCore } from './core';
import { createPlanApi, type PlanApi } from './plan';
import { createStopApi, type StopApi, type StopOptions } from './stops';
import { createTripApi, type TripApi } from './trips';
import { createRouteApi, type RouteApi, type RouteOptions } from './routes';
import { createVehicleApi, type VehicleApi } from './vehicles';
import { createGeoApi, type GeoApi } from './geo';
import { createMetaApi, type MetaApi } from './meta';
import { createSearchApi, type SearchApi } from './search';
import type { PlanRequest, PlanResult } from '../types/plan';
import type { VehicleBounds, TripKeyInput, VehiclePosition } from '../types/vehicle';
import type {
  NearestRequest,
  StationSearchResult,
  GeoJsonFeatureCollection,
  GeocodeOptions,
  StopGroupRadiusResult,
  SearchTripSummary,
  SearchTripsRequest,
  PlanParameters,
  Country,
  Agency,
  StopGroupsByRadiusRequest,
} from '../types/geo';
import type { StopDetail, StopRoutesResponse, StopCluster, GroupedChildStop } from '../types/stop';
import type { TripDetail } from '../types/trip';
import type { RouteDetail, RouteSummary } from '../types/route';
import type { LatLng } from './utils/polyline';

/**
 * A configured MÁV PlusZ client. Create one with {@link createMavPlusz}.
 *
 * All methods are thin typed wrappers around the OpenTripPlanner v2 GraphQL
 * API served by mavplusz.hu. No API key is required on the public deployment.
 */
export class MavPluszClient implements ClientCore {
  readonly config: ResolvedConfig;
  readonly transport: HttpTransport;

  readonly planApi: PlanApi;
  readonly stopApi: StopApi;
  readonly tripApi: TripApi;
  readonly routeApi: RouteApi;
  readonly vehicleApi: VehicleApi;
  readonly geoApi: GeoApi;
  readonly metaApi: MetaApi;
  readonly searchApi: SearchApi;

  constructor(options: MavPluszOptions = {}) {
    this.config = resolveConfig(options);

    const headers: Record<string, string> = { ...this.config.headers };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    this.transport = new HttpTransport({
      baseUrl: this.config.baseUrl,
      graphqlPath: graphqlPathFor(this.config.router),
      timeout: this.config.timeout,
      headers,
      fetch: options.fetch,
    });

    this.planApi = createPlanApi(this);
    this.stopApi = createStopApi(this);
    this.tripApi = createTripApi(this);
    this.routeApi = createRouteApi(this);
    this.vehicleApi = createVehicleApi(this);
    this.geoApi = createGeoApi(this);
    this.metaApi = createMetaApi(this);
    this.searchApi = createSearchApi(this);
  }

  get language(): string {
    return this.config.language;
  }

  // ── convenience aliases ──────────────────────────────────────────────

  /** Plan an itinerary. */
  async plan(request: PlanRequest): Promise<PlanResult> {
    return this.planApi.plan(request);
  }

  /** Full detail of a stop. */
  async stop(id: string, options?: StopOptions): Promise<StopDetail> {
    return this.stopApi.stop(id, options);
  }

  /** Routes serving a stop with live vehicle positions. */
  async stopRoutes(id: string): Promise<StopRoutesResponse> {
    return this.stopApi.stopRoutes(id);
  }

  /** Lightweight stops around a coordinate with their serving routes. */
  async stopsByRadius(lat: number, lon: number, radius: number): Promise<GroupedChildStop[]> {
    return this.stopApi.stopsByRadius(lat, lon, radius);
  }

  /** Resolve stop cluster ids to their grouped child stops. */
  async stopClusters(ids: string[]): Promise<StopCluster[]> {
    return this.stopApi.stopClusters(ids);
  }

  /** Nearby stop groups with departures. */
  async stopGroupsByRadius(request: StopGroupsByRadiusRequest): Promise<StopGroupRadiusResult> {
    return this.stopApi.stopGroupsByRadius(request);
  }

  /** Full trip detail (stop times, on-board services, live vehicle). */
  async trip(id: string, serviceDay?: ISODate): Promise<TripDetail> {
    return this.tripApi.trip(id, serviceDay);
  }

  /** Trip shape as decoded polyline coordinates. */
  async tripGeometry(id: string): Promise<{ points: string; coordinates: LatLng[] }> {
    return this.tripApi.tripGeometry(id);
  }

  /** Full route detail. */
  async route(id: string, options?: RouteOptions): Promise<RouteDetail> {
    return this.routeApi.route(id, options);
  }

  /** Live vehicle positions inside a bounding box. */
  async vehiclesInBounds(bounds: VehicleBounds, modes?: Mode[]): Promise<VehiclePosition[]> {
    return this.vehicleApi.vehiclesInBounds(bounds, modes);
  }

  /** Live positions for specific trips. */
  async vehiclePositionsForTrips(trips: TripKeyInput[]): Promise<VehiclePosition[]> {
    return this.vehicleApi.vehiclePositionsForTrips(trips);
  }

  /** Nearby places. */
  async nearest(request: NearestRequest): Promise<import('../types/geo').NearestResult> {
    return this.geoApi.nearest(request);
  }

  /** Station search by name. */
  async geocodeStations(
    q: string,
    options?: { limit?: number; lang?: string },
  ): Promise<StationSearchResult> {
    return this.geoApi.geocodeStations(q, options);
  }

  /** Full OSM geocoding via Photon. */
  async geocode(q: string, options?: GeocodeOptions): Promise<GeoJsonFeatureCollection> {
    return this.geoApi.geocode(q, options);
  }

  /** Supported countries. */
  async countries(): Promise<Country[]> {
    return this.metaApi.countries();
  }

  /** Transit agencies. */
  async agencies(countryIsoCodes?: string[]): Promise<Agency[]> {
    return this.metaApi.agencies(countryIsoCodes);
  }

  /** All routes (compact). */
  async routes(countryIsoCodes?: string[]): Promise<RouteSummary[]> {
    return this.metaApi.routes(countryIsoCodes);
  }

  /** Fare / comfort level catalogue. */
  async planParameters(): Promise<PlanParameters> {
    return this.metaApi.planParameters();
  }

  /** Search for trips by name, number or route text. */
  async searchTrips(request: SearchTripsRequest): Promise<SearchTripSummary[]> {
    return this.searchApi.searchTrips(request);
  }

  // ── raw GraphQL ──────────────────────────────────────────────────────

  /**
   * Execute an arbitrary GraphQL query against the MÁV PlusZ endpoint.
   * Throws {@link MavPluszGraphQLError} when the server reports errors.
   */
  async graphql<TData>(
    query: string,
    variables?: Record<string, unknown>,
    operationName?: string | null,
  ): Promise<GraphQLResponse<TData>> {
    const response = await this.transport.requestGraphQL<TData>({
      query,
      variables: variables ?? {},
      operationName: operationName ?? null,
    });
    if (response.errors && response.errors.length > 0) {
      throw new MavPluszGraphQLError(response.errors);
    }
    if (response.data == null) {
      throw new MavPluszError('Transit service returned no data');
    }
    return response;
  }
}

export interface MavPluszFactory {
  (options?: MavPluszOptions): MavPluszClient;
}
