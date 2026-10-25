import type {
  Accessibility,
  EpochSec,
  Mode,
  PickupDropoffType,
  RealtimeState,
  SecondsSinceMidnight,
  TransitId,
} from './common';

import type { Alert } from './alerts';

import type { InfoService, Stop, StopGeometries } from './stop';

import type { VehiclePosition } from './vehicle';

export interface TripRouteRef {
  id: TransitId | null;
  gtfsId?: TransitId | null;
  mode: Mode | null;
  shortName: string | null;
  longName: string | null;
  type?: number | null;
  color?: string | null;
  textColor?: string | null;
  url?: string | null;
  bikesAllowed?: Accessibility | null;
  agency?: {
    id?: TransitId;
    gtfsId?: TransitId;
    name: string;
    url?: string | null;
    timezone?: string | null;
    lang?: string | null;
    phone?: string | null;
    fareUrl?: string | null;
  } | null;
  patterns?: {
    id: TransitId;
    tripsForDate?: {
      id: TransitId;
      stops?: {
        id: TransitId;
      }[];
    }[];
  }[];
}

export interface TripPatternRef {
  headsign?: string | null;
  id: TransitId | null;
  stops?:
    | {
        id: TransitId;
        name?: string;
        lat?: number;
        lon?: number;
      }[]
    | null;
}

export interface TripStopTimeStop extends Stop {
  alerts?: Alert[];
  stopId?: TransitId;
  geometries?: StopGeometries;
}

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

export interface ThroughCoach {
  trip: {
    id: TransitId | null;
    tripShortName: string | null;
    routeShortName: string | null;
    stoptimes?:
      | {
          stop: {
            name: string | null;
          } | null;
        }[]
      | null;
    route: {
      mode: Mode | null;
      shortName: string | null;
      longName: string | null;
      textColor: string | null;
      color: string | null;
    } | null;
  } | null;
  attachedFromStop: {
    name: string | null;
  } | null;
  attachedTillStop: {
    name: string | null;
  } | null;
  serviceDateDayChange: number | null;
}

export type PullingTrip = ThroughCoach;

export interface TripDetail {
  id: TransitId;
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
  isThroughCoach?: boolean | null;
  throughCoaches?: ThroughCoach[] | null;
  pullingTrips?: PullingTrip[] | null;
  vehiclePositions?: VehiclePosition[] | null;
}
