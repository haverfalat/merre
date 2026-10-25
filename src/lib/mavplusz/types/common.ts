/**
 * Shared / low-level types used across the whole MÁV PlusZ (OTP v2) API.
 */

/** Human readable GraphQL identifier, e.g. `1:005510017`, `BKK:F01159`. */
export type GtfsId = string;

/** Base64-encoded node id returned by GraphQL, e.g. `U3RvcDoxOjAwNTUxMDAxNw`. */
export type NodeId = string;

/** Time as seconds since local midnight (GTFS style), e.g. `45900` = 12:45. */
export type SecondsSinceMidnight = number;

/** UNIX time in seconds. */
export type EpochSec = number;

/** UNIX time in milliseconds (JS `Date.now()` scale). */
export type EpochMillis = number;

/** ISO date string, e.g. `2026-08-10`. */
export type ISODate = string;

/** ISO 639-1 language tag, e.g. `hu`, `en-US`. */
export type Language = string;

/** Localized text pair. */
export interface I18nText {
  lang: string;
  text: string;
}

/** Transport modes used by the plan API and vehicle filters. */
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

/** Real-time status of a stop time. */
export type RealtimeState = 'SCHEDULED' | 'UPDATED' | 'MODIFIED' | 'CANCELED' | 'ADDED' | 'SKIPPED';

/** Pickup / dropoff booking type. */
export type PickupDropoffType = 'SCHEDULED' | 'NONE' | 'COORDINATE_WITH_DRIVER';

/** Wheelchair / bicycle accessibility answer. */
export type Accessibility =
  | 'ALLOWED'
  | 'NOT_ALLOWED'
  | 'NO_INFORMATION'
  | 'POSSIBLE'
  | 'POSSIBLE_WHEN_NO_OTHER_OPTIONS';

/** Location type of a stop. */
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

/** Encoded polyline geometry (Google encoded polyline + length). */
export interface PolylineGeometry {
  points: string;
  length?: number;
}

export interface GraphQLErrorLocation {
  line: number;
  column: number;
}

export interface GraphQLError {
  message: string;
  locations?: GraphQLErrorLocation[];
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLError[];
}

export interface BoardingStop {
  id: string;
  parentStation?: { id: string } | null;
}
