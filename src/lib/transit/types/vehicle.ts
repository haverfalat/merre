import type { EpochSec, Mode, SecondsSinceMidnight, TransitId } from './common';

export type VehicleStopStatus = 'INCOMING' | 'STOPPED_AT' | 'IN_TRANSIT_TO';

export interface VehicleStop {
  gtfsId: TransitId | null;
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
  stop: {
    name: string | null;
  } | null;
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
  id: TransitId | null;
  gtfsId: TransitId | null;
  routeShortName: string | null;
  tripHeadsign: string | null;
  tripShortName: string | null;
  tripNumber?: string | null;
  serviceDate?: string | null;
  serviceId?: string | null;
  activeDates?: string[];
  route: {
    id?: TransitId | null;
    mode: Mode | null;
    shortName: string | null;
    longName: string | null;
    textColor: string | null;
    color: string | null;
  } | null;
  pattern: {
    id: TransitId | null;
  } | null;
}

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
  /** Metres per second (OTP/GTFS units). */
  speed: number | null;
  stopRelationship: StopRelationship | null;
  trip: VehicleTrip | null;
  nextStop: VehicleNextStop | null;
  prevOrCurrentStop: VehiclePrevOrCurrentStop | null;
}

export interface RoutePatternInfo {
  id: TransitId | null;
  directionId?: number | null;
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
  /** Metres per second (OTP/GTFS units). */
  speed: number | null;
  stopRelationship: StopRelationship | null;
  nextStop: VehicleNextStop | null;
  prevOrCurrentStop: VehiclePrevOrCurrentStop | null;
  trip: VehicleTrip | null;
}

export interface VehicleBounds {
  swLat: number;
  swLon: number;
  neLat: number;
  neLon: number;
}
