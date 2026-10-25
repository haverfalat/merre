import type {
  GtfsId,
  NodeId,
  Mode,
  RealtimeState,
  PickupDropoffType,
  SecondsSinceMidnight,
  EpochSec,
  Accessibility,
} from './common';
import type { Alert } from './alerts';
import type { Stop, StopGeometries, InfoService } from './stop';
import type { VehiclePosition } from './vehicle';

export interface TripRouteRef {
  id: GtfsId | null;
  gtfsId?: GtfsId | null;
  mode: Mode | null;
  shortName: string | null;
  longName: string | null;
  type?: number | null;
  color?: string | null;
  textColor?: string | null;
  url?: string | null;
  bikesAllowed?: Accessibility | null;
  agency?: {
    id?: GtfsId;
    gtfsId?: GtfsId;
    name: string;
    url?: string | null;
    timezone?: string | null;
    lang?: string | null;
    phone?: string | null;
    fareUrl?: string | null;
  } | null;
  patterns?: {
    id: NodeId;
    tripsForDate?: { id: GtfsId; stops?: { id: GtfsId }[] }[];
  }[];
}

export interface TripPatternRef {
  headsign?: string | null;
  id: NodeId | null;
  stops?: { id: GtfsId; name?: string; lat?: number; lon?: number }[] | null;
}

export interface TripStopTimeStop extends Stop {
  alerts?: Alert[];
  stopId?: GtfsId;
  geometries?: StopGeometries;
}

/** Stop time within a full trip detail. */
export interface TripStopTime {
  headsign?: string | null;
  stop: TripStopTimeStop;
  scheduledArrival: SecondsSinceMidnight | null;
  realtimeArrival: SecondsSinceMidnight | null;
  arrivalDelay: number | null;
  scheduledDeparture: SecondsSinceMidnight | null;
  realtimeDeparture: SecondsSinceMidnight | null;
  departureDelay: number | null;
  pickupType: PickupDropoffType | null;
  dropoffType: PickupDropoffType | null;
  timepoint: boolean | null;
  realtime: boolean | null;
  realtimeState: RealtimeState | null;
  serviceDay: EpochSec | null;
  platformColor?: string | null;
}

/** A coupled / coupled-through train part. */
export interface ThroughCoach {
  trip: {
    id: GtfsId | null;
    tripShortName: string | null;
    routeShortName: string | null;
    stoptimes?: { stop: { name: string | null } | null }[] | null;
    route: {
      mode: Mode | null;
      shortName: string | null;
      longName: string | null;
      textColor: string | null;
      color: string | null;
    } | null;
  } | null;
  attachedFromStop: { name: string | null } | null;
  attachedTillStop: { name: string | null } | null;
  serviceDateDayChange: number | null;
}

export type PullingTrip = ThroughCoach;

/** Full trip detail returned by `trip(id, serviceDay)`. */
export interface TripDetail {
  id: GtfsId;
  alerts?: Alert[];
  pattern?: TripPatternRef | null;
  serviceDescriptions?: string[] | null;
  infoServices?: InfoService[] | null;
  route?: TripRouteRef | null;
  tripShortName?: string | null;
  tripHeadsign?: string | null;
  serviceId?: string | null;
  directionId?: number | null;
  blockId?: string | null;
  shapeId?: string | null;
  wheelchairAccessible?: Accessibility | null;
  bikesAllowed?: Accessibility | null;
  stoptimes?: TripStopTime[] | null;
  tripGeometry?: { length: number | null; points: string | null } | null;
  isThroughCoach?: boolean | null;
  throughCoaches?: ThroughCoach[] | null;
  pullingTrips?: PullingTrip[] | null;
  vehiclePositions?: VehiclePosition[] | null;
}
