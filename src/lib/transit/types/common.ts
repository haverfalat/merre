export type TransitId = string;

export type SecondsSinceMidnight = number;

export type EpochSec = number;

export type ISODate = string;

export type Mode =
  | 'RAIL'
  | 'RAIL_REPLACEMENT_BUS'
  | 'SUBURBAN_RAILWAY'
  | 'TRAMTRAIN'
  | 'COACH'
  | 'SUBWAY'
  | 'TRAM'
  | 'TROLLEYBUS'
  | 'BUS'
  | 'FERRY'
  | 'CABLE_CAR'
  | 'GONDOLA'
  | 'FUNICULAR'
  | 'AIRPLANE'
  | 'WALK'
  | 'BICYCLE'
  | 'CAR'
  | 'MOTORCYCLE'
  | 'GOOGLE'
  | 'SCOOTER'
  | 'CAR_PICKUP'
  | 'BICYCLE_RENT'
  | 'VEHICLE_RENT';

export type RealtimeState = 'SCHEDULED' | 'UPDATED' | 'MODIFIED' | 'CANCELED' | 'ADDED' | 'SKIPPED';

export type PickupDropoffType = 'SCHEDULED' | 'NONE' | 'COORDINATE_WITH_DRIVER';

export type Accessibility =
  | 'ALLOWED'
  | 'NOT_ALLOWED'
  | 'NO_INFORMATION'
  | 'POSSIBLE'
  | 'POSSIBLE_WHEN_NO_OTHER_OPTIONS';

export type LocationType =
  | 'STOP'
  | 'STATION'
  | 'STATION_ENTRANCE'
  | 'ENTRANCE'
  | 'GENERIC_NODE'
  | 'BOARDING_AREA';

export interface GeoJsonGeometry {
  type: string;
  coordinates?: unknown;
  geometries?: GeoJsonGeometry[];
}
