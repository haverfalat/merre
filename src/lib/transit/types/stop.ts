import type {
  Accessibility,
  EpochSec,
  GeoJsonGeometry,
  LocationType,
  Mode,
  PickupDropoffType,
  RealtimeState,
  SecondsSinceMidnight,
  TransitId,
} from './common';

import type { Alert } from './alerts';

import type { RoutePatternInfo, RouteVehiclePositions } from './vehicle';

import type { BoardingStop } from '../../boarding-stops';

export interface StopGeometries {
  geoJson: GeoJsonGeometry | null;
}

export interface MetroBoardingDirection {
  routeId: string;
  directionId?: string;
  headsign: string;
  origin: string | null;
  event: 'departures' | 'arrivals';
}

export interface Stop {
  boardingDirections?: MetroBoardingDirection[];
  id: TransitId | null;
  gtfsId?: TransitId | null;
  stopId?: TransitId | null;
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

export interface StopService {
  id: string | null;
  name: string | null;
  fontCode: number | null;
  fontCharSet: string | null;
  displayable: boolean | null;
}

export interface StopRouteSummary {
  id: TransitId;
  agency: {
    gtfsId: TransitId;
    name: string;
    url: string | null;
  } | null;
  longName: string | null;
  mode: Mode | null;
  color: string | null;
  textColor: string | null;
  shortName: string | null;
}

export interface TripStopsRef {
  gtfsId: TransitId;
  name: string | null;
}

export interface InfoServiceStopRef {
  id: TransitId | null;
  name: string | null;
  timezone?: string | null;
}

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
  id: TransitId | null;
  gtfsId: TransitId;
  bikesAllowed?: Accessibility | null;
  tripShortName?: string | null;
  tripHeadsign: string | null;
  wheelchairAccessible?: Accessibility | null;
  stops?: TripStopsRef[] | null;
  infoServices?: InfoService[] | null;
}

export interface Stoptime {
  /** Explicit stop-level rule, when supplied by the source. */
  requiresFirstDoorBoarding?: boolean | null;
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
    id?: TransitId | TransitId | null;
    gtfsId?: TransitId | null;
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

export interface StopRoutesResponse extends BoardingStop {
  boardingDirections?: MetroBoardingDirection[];
  boardingStops?: BoardingStop[];
  platformCode: string | null;
  routes: {
    shortName: string | null;
    longName: string | null;
    mode: Mode | null;
    color: string | null;
    textColor: string | null;
    id: TransitId;
    patterns?: (RoutePatternInfo & {
      stops?: BoardingStop[];
      vehiclePositions?: RouteVehiclePositions[];
    })[];
  }[];
}

export interface StopDetail extends Stop {
  alerts?: Alert[];
  routes?: StopRouteSummary[] | null;
  stopTimes?: StoptimePatternGroup[] | null;
}

export interface GroupedChildStop extends Stop {
  /** An exact boarding-point position used by the map instead of national station grouping. */
  positionSource?: 'bkk-metro';
  routes?: StopRouteSummary[] | null;
}
