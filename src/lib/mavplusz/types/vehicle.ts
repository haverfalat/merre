import type {
  GtfsId,
  NodeId,
  EpochSec,
  Mode,
  SecondsSinceMidnight,
  PolylineGeometry,
} from './common';

/** Relationship of a vehicle to a stop along its trip. */
export type VehicleStopStatus = 'INCOMING' | 'STOPPED_AT' | 'IN_TRANSIT_TO';

/** A stop the vehicle is currently at / heading to. */
export interface VehicleStop {
  gtfsId: GtfsId | null;
  name: string | null;
}

export interface StopRelationship {
  status: VehicleStopStatus | null;
  stop: VehicleStop | null;
  arrivalTime: SecondsSinceMidnight | null;
  departureTime: SecondsSinceMidnight | null;
}

export interface VehicleNextStop {
  arrivalDelay: number | null;
  stop: { name: string | null } | null;
}

export interface VehiclePrevOrCurrentStop {
  scheduledArrival: SecondsSinceMidnight | null;
  realtimeArrival: SecondsSinceMidnight | null;
  arrivalDelay: number | null;
  scheduledDeparture: SecondsSinceMidnight | null;
  realtimeDeparture: SecondsSinceMidnight | null;
  departureDelay: number | null;
}

export interface VehicleTrip {
  id: NodeId | null;
  gtfsId: GtfsId | null;
  routeShortName: string | null;
  tripHeadsign: string | null;
  tripShortName: string | null;
  tripNumber?: string | null;
  serviceDate?: string | null;
  serviceId?: string | null;
  activeDates?: string[];
  route: {
    id?: GtfsId | null;
    mode: Mode | null;
    shortName: string | null;
    longName: string | null;
    textColor: string | null;
    color: string | null;
  } | null;
  pattern: { id: NodeId | null } | null;
}

/** A live vehicle position (GPS ping) with the trip it is running. */
export interface VehiclePosition {
  vehicleId: string | null;
  isEstimated: boolean | null;
  lat: number | null;
  lon: number | null;
  heading: number | null;
  vehicleModel: string | null;
  label: string | null;
  licensePlate: string | null;
  uicCode: string | null;
  lastUpdated: EpochSec | null;
  speed: number | null;
  stopRelationship: StopRelationship | null;
  trip: VehicleTrip | null;
  nextStop: VehicleNextStop | null;
  prevOrCurrentStop: VehiclePrevOrCurrentStop | null;
}

/** Bounding box filter for `vehiclesInBounds`. */
export interface VehicleBounds {
  /** South-west latitude. */
  swLat: number;
  /** South-west longitude. */
  swLon: number;
  /** North-east latitude. */
  neLat: number;
  /** North-east longitude. */
  neLon: number;
}

/** Input for `vehiclePositionsForTrips`. */
export interface TripKeyInput {
  /** GtfsId of the trip, e.g. `1:33736056`. */
  id: GtfsId;
  /** Service day in epoch millis, or an ISO date string. */
  serviceDay?: number | string;
}

export interface RoutePatternInfo {
  id: NodeId | null;
  directionId?: number | null;
  patternGeometry?: PolylineGeometry | null;
}

export interface RouteVehiclePositions {
  vehicleId: string | null;
  lat: number | null;
  lon: number | null;
  heading: number | null;
  label: string | null;
  uicCode: string | null;
  licensePlate: string | null;
  lastUpdated: EpochSec | null;
  speed: number | null;
  stopRelationship: StopRelationship | null;
  nextStop: VehicleNextStop | null;
  prevOrCurrentStop: VehiclePrevOrCurrentStop | null;
  trip: VehicleTrip | null;
}
