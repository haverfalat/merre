import type {
  GtfsId,
  NodeId,
  Mode,
  Accessibility,
  ISODate,
  EpochSec,
  PolylineGeometry,
} from './common';
import type { Alert } from './alerts';
import type { Stop } from './stop';
import type { RouteVehiclePositions } from './vehicle';

export interface RouteAgency {
  id?: GtfsId;
  gtfsId?: GtfsId;
  name: string;
  url?: string | null;
  timezone?: string | null;
  lang?: string | null;
  phone?: string | null;
  fareUrl?: string | null;
}

export interface RouteTripRef {
  id: GtfsId | null;
  gtfsId?: GtfsId | null;
  tripShortName?: string | null;
  tripHeadsign?: string | null;
  serviceId?: string | null;
  directionId?: number | null;
  routeShortName?: string | null;
  wheelchairAccessible?: Accessibility | null;
  bikesAllowed?: Accessibility | null;
  activeDates?: string[] | null;
  route?: {
    mode?: Mode | null;
    shortName?: string | null;
    longName?: string | null;
    textColor?: string | null;
    color?: string | null;
  } | null;
  pattern?: { id?: NodeId | null } | null;
  departureStoptime?: { scheduledDeparture?: number | null } | null;
  stops?: { id: GtfsId }[] | null;
}

/** A route pattern (a specific direction/geometry of a route). */
export interface RoutePattern {
  id: NodeId | null;
  headsign?: string | null;
  fromStopName?: string | null;
  name?: string | null;
  directionId?: number | null;
  patternGeometry?: PolylineGeometry | null;
  trips?: { activeDates?: string[] | null }[] | null;
  tripsForDate?: RouteTripRef[] | null;
  stops?:
    | (Stop & { routes?: { textColor: string | null; color: string | null }[] | null })[]
    | null;
  alerts?: Alert[] | null;
  vehiclePositions?: RouteVehiclePositions[] | null;
}

/** Full route detail returned by `route(id)`. */
export interface RouteDetail {
  id: GtfsId;
  alerts?: Alert[];
  desc?: string | null;
  agency?: RouteAgency | null;
  longName?: string | null;
  shortName?: string | null;
  mode?: Mode | null;
  type?: number | null;
  color?: string | null;
  textColor?: string | null;
  bikesAllowed?: Accessibility | null;
  url?: string | null;
  patterns?: RoutePattern[] | null;
}

/** Compact route list item returned by `routes(...)`. */
export interface RouteSummary {
  id: GtfsId;
  agency?: { id?: GtfsId; name?: string | null } | null;
  longName?: string | null;
  shortName?: string | null;
  mode?: Mode | null;
  type?: number | null;
  color?: string | null;
  textColor?: string | null;
}

export interface TripKey {
  id: GtfsId;
  serviceDay?: EpochSec | ISODate | null;
}
