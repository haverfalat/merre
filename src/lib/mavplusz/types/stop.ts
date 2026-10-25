import type {
  GtfsId,
  NodeId,
  Mode,
  RealtimeState,
  PickupDropoffType,
  SecondsSinceMidnight,
  EpochSec,
  LocationType,
  Accessibility,
  GeoJsonGeometry,
  BoardingStop,
} from './common';
import type { Alert } from './alerts';
import type { RouteVehiclePositions, RoutePatternInfo } from './vehicle';

export interface StopGeometries {
  geoJson: GeoJsonGeometry | null;
}

/** Basic stop information. */
export interface Stop {
  id: GtfsId | null;
  gtfsId?: GtfsId | null;
  stopId?: GtfsId | null;
  code: string | null;
  platformCode: string | null;
  name: string | null;
  lat: number | null;
  lon: number | null;
  locationType?: LocationType | null;
  timezone?: string | null;
  zoneId?: string | null;
  url?: string | null;
  wheelchairBoarding?: Accessibility | null;
  bearing?: number | null;
  geometries?: StopGeometries | null;
  services?: StopService[] | null;
}

/** Simple on-stop service indicator (simplified version of InfoService). */
export interface StopService {
  id: string | null;
  name: string | null;
  fontCode: number | null;
  fontCharSet: string | null;
  displayable: boolean | null;
}

export interface StopRouteSummary {
  id: GtfsId;
  agency: { gtfsId: GtfsId; name: string; url: string | null } | null;
  longName: string | null;
  mode: Mode | null;
  color: string | null;
  textColor: string | null;
  shortName: string | null;
}

export interface TripStopsRef {
  gtfsId: GtfsId;
  name: string | null;
}

export interface InfoServiceStopRef {
  id: GtfsId | null;
  name: string | null;
  timezone?: string | null;
}

/** On-train / on-board service info (e.g. air conditioning, seat classes). */
export interface InfoService {
  name: string;
  fontCode: number;
  displayable: boolean;
  fontCharSet: string;
  fromStopIndex: number | null;
  tillStopIndex: number | null;
  fromStop: InfoServiceStopRef | null;
  tillStop: InfoServiceStopRef | null;
}

export interface StoptimeTripRef {
  id: NodeId | null;
  gtfsId: GtfsId;
  bikesAllowed?: Accessibility | null;
  tripShortName?: string | null;
  tripHeadsign: string | null;
  wheelchairAccessible?: Accessibility | null;
  stops?: TripStopsRef[] | null;
  infoServices?: InfoService[] | null;
}

export interface Stoptime {
  headsign?: string | null;
  scheduledArrival: SecondsSinceMidnight | null;
  realtimeArrival: SecondsSinceMidnight | null;
  arrivalDelay: number | null;
  scheduledDeparture: SecondsSinceMidnight | null;
  realtimeDeparture: SecondsSinceMidnight | null;
  departureDelay: number | null;
  pickupType?: PickupDropoffType | null;
  dropoffType?: PickupDropoffType | null;
  realtime?: boolean | null;
  realtimeState?: RealtimeState | null;
  serviceDay?: EpochSec | null;
  platformColor?: string | null;
  timepoint?: boolean | null;
  stop?: Stop | null;
  trip?: StoptimeTripRef | null;
}

export interface StoptimePattern {
  directionId?: number | null;
  desc?: string | null;
  headsign: string | null;
  id?: string | null;
  fromStopName?: string | null;
  route: {
    id?: GtfsId | NodeId | null;
    gtfsId?: GtfsId | null;
    desc?: string | null;
    color?: string | null;
    textColor?: string | null;
    mode?: Mode | null;
    shortName?: string | null;
    longName?: string | null;
  } | null;
}

export interface StoptimePatternGroup {
  pattern: StoptimePattern | null;
  times: Stoptime[];
}

export interface StopPatternRouteRef {
  id: NodeId | null;
  desc?: string | null;
  color?: string | null;
  textColor?: string | null;
  mode?: Mode | null;
  shortName?: string | null;
  longName?: string | null;
}

/** Route detail shape used by `stop` / `StopRoutes` queries. */
export interface StopRoutesResponse extends BoardingStop {
  boardingStops?: BoardingStop[];
  platformCode: string | null;
  routes: {
    shortName: string | null;
    longName: string | null;
    mode: Mode | null;
    color: string | null;
    textColor: string | null;
    id: GtfsId;
    patterns?: (RoutePatternInfo & {
      stops?: BoardingStop[];
      vehiclePositions?: RouteVehiclePositions[];
    })[];
  }[];
}

/** Full stop detail returned by `stop(id)`. */
export interface StopDetail extends Stop {
  alerts?: Alert[];
  routes?: StopRouteSummary[] | null;
  stopTimes?: StoptimePatternGroup[] | null;
}

/** A child stop inside a stop cluster. */
export interface GroupedChildStop extends Stop {
  routes?: StopRouteSummary[] | null;
}

/** Cluster of stops belonging to the same station. */
export interface StopCluster {
  id: NodeId | null;
  gtfsId: GtfsId | null;
  lat: number | null;
  lon: number | null;
  name: string | null;
  groupedChildStops: GroupedChildStop[];
}

/** A node returned by `stopGroupsByRadius`. */
export interface StopGroupNode {
  stop: Stop & { routes?: StopRouteSummary[] | null; stopTimes?: StoptimePatternGroup[] | null };
}

export interface StopGroupEdge {
  node: StopGroupNode;
}

export interface StopGroupResult {
  edges: StopGroupEdge[];
}
