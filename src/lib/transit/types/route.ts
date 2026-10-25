import type { Accessibility, Mode, TransitId } from './common';

import type { Alert } from './alerts';

import type { Stop } from './stop';

import type { RouteVehiclePositions } from './vehicle';

export interface RouteAgency {
  id?: TransitId;
  gtfsId?: TransitId;
  name: string;
  url?: string | null;
  timezone?: string | null;
  lang?: string | null;
  phone?: string | null;
  fareUrl?: string | null;
}

export interface RouteTripRef {
  id: TransitId | null;
  gtfsId?: TransitId | null;
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
  pattern?: {
    id?: TransitId | null;
  } | null;
  departureStoptime?: {
    scheduledDeparture?: number | null;
  } | null;
  stops?:
    | {
        id: TransitId;
      }[]
    | null;
}

export interface RoutePattern {
  coordinates?: [number, number][];
  id: TransitId | null;
  headsign?: string | null;
  fromStopName?: string | null;
  name?: string | null;
  directionId?: number | null;
  trips?:
    | {
        activeDates?: string[] | null;
      }[]
    | null;
  tripsForDate?: RouteTripRef[] | null;
  stops?:
    | (Stop & {
        routes?:
          | {
              textColor: string | null;
              color: string | null;
            }[]
          | null;
      })[]
    | null;
  alerts?: Alert[] | null;
  vehiclePositions?: RouteVehiclePositions[] | null;
}

export interface RouteDetail {
  id: TransitId;
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

export interface RouteSummary {
  id: TransitId;
  agency?: {
    id?: TransitId;
    name?: string | null;
  } | null;
  longName?: string | null;
  shortName?: string | null;
  mode?: Mode | null;
  type?: number | null;
  color?: string | null;
  textColor?: string | null;
}
