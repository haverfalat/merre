import type { StopConnectionsResponse } from '@/lib/transit/types/connections';
import type { JourneyPlan, JourneyRequest, JourneyOptions } from './types/plan';
import type { Mode } from './types/common';
import type { GeoJsonFeatureCollection, SearchTripSummary, StationSearchResult } from './types/geo';
import type { RouteDetail, RoutePattern, RouteSummary } from './types/route';
import type { GroupedChildStop, StopDetail, StopRoutesResponse } from './types/stop';
import type { TripDetail } from './types/trip';
import type { VehicleBounds, VehiclePosition } from './types/vehicle';

export interface TransitRequest {
  signal: AbortSignal;
  language: 'hu' | 'en';
}

export interface StopBoardRequest {
  startTime?: number;
  timeRange?: number;
}

export interface DecodedTripDetail extends TripDetail {
  decodedPolyline: [number, number][];
}

export interface TransitClient {
  readonly backendId: string;
  plan(request: JourneyRequest): Promise<JourneyPlan>;
  planOptions(): Promise<JourneyOptions>;
  stop(id: string, options?: StopBoardRequest): Promise<StopDetail | null>;
  stopRoutes(id: string): Promise<StopRoutesResponse | null>;
  stopConnections(id: string): Promise<StopConnectionsResponse | null>;
  stopsByRadius(lat: number, lon: number, radius: number): Promise<GroupedChildStop[]>;
  stopsInBounds(bounds: VehicleBounds): Promise<GroupedChildStop[]>;
  trip(id: string, serviceDay?: string): Promise<DecodedTripDetail | null>;
  route(id: string, options?: { serviceDay?: string }): Promise<RouteDetail | null>;
  routePatternTrips(id: string, serviceDay: string): Promise<RoutePattern[]>;
  vehiclesInBounds(bounds: VehicleBounds, modes: Mode[]): Promise<VehiclePosition[]>;
  geocodeStations(query: string, options?: { limit?: number }): Promise<StationSearchResult>;
  geocode(query: string, options?: { limit?: number }): Promise<GeoJsonFeatureCollection>;
  routes(countries?: string[]): Promise<RouteSummary[]>;
  searchTrips(request: {
    searchString: string;
    modes: Mode[];
    date: string;
  }): Promise<SearchTripSummary[]>;
}
