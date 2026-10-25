import type {
  Mode,
  EpochMillis,
  Accessibility,
  RealtimeState,
  PickupDropoffType,
  ISODate,
  GtfsId,
  NodeId,
  PolylineGeometry,
  Language,
} from './common';
import type { Alert, AlertSummary } from './alerts';
import type { InfoService } from './stop';

/** A place used as from/to in a plan request. */
export type PlaceInput =
  | string
  | {
      /** Display name (optional). */
      name?: string;
      /** GTFS id of a stop/station, e.g. `1:005510017_0`. */
      gtfsId?: string;
      /** Latitude (required when `gtfsId` is omitted). */
      lat?: number;
      /** Longitude (required when `gtfsId` is omitted). */
      lon?: number;
    };

export interface TransportMode {
  mode: Mode;
}

export interface InputBanned {
  routes?: string[] | null;
  agencies?: string[] | null;
  stops?: string[] | null;
  trips?: string[] | null;
}

export interface InputPreferred {
  routes?: string[] | null;
  agencies?: string[] | null;
  stops?: string[] | null;
  trips?: string[] | null;
}

export interface InputUnpreferred {
  routes?: string[] | null;
  agencies?: string[] | null;
  stops?: string[] | null;
  trips?: string[] | null;
}

export interface PassengerInput {
  passengerCategoryId: string;
  discountCardId?: string | null;
}

export interface PlanRequest {
  from: PlaceInput;
  to: PlaceInput;
  /** Departure date `YYYY-MM-DD`. Defaults to today. */
  date?: ISODate;
  /** Departure time `HH:MM` (24h). Defaults to now. */
  time?: string;
  /** If true, plan an arrival by `date`/`time` instead of a departure. */
  arriveBy?: boolean;
  /** Transport modes to allow. Defaults to all rail/road modes. */
  modes?: Mode[];
  /** Number of itineraries to return. Defaults to 15. */
  numItineraries?: number;
  /** Walking speed in m/s. Defaults to 1.39 (~5 km/h). */
  walkSpeed?: number;
  walkReluctance?: number;
  bikeReluctance?: number;
  carReluctance?: number;
  /** Wheelchair accessible itinerary only. */
  wheelchair?: boolean;
  /** Minimum transfer time in seconds. */
  minTransferTime?: number;
  transitPassFilter?: string[];
  /** Comfort level fare codes, e.g. `['A', 'B']` (from planParameters). */
  comfortLevels?: string[];
  searchParameters?: string[];
  preferred?: InputPreferred;
  banned?: InputBanned;
  unpreferred?: InputUnpreferred;
  passengers?: PassengerInput[];
  pageCursor?: string;
}

export interface Currency {
  code: string;
  digits?: number | null;
}

export interface FarePrice {
  amount: number | null;
  currency: Currency | null;
}

export interface FareProduct {
  id: string;
  product: {
    __typename?: string | null;
    id?: string | null;
    name?: string | null;
    medium?: { id?: string | null; name?: string | null } | null;
    riderCategory?: { id?: string | null; name?: string | null } | null;
    price?: FarePrice | null;
  } | null;
}

export interface RentalVehicleRef {
  id?: string | null;
  network?: string | null;
}

export interface PlanStopRef {
  stationUicPricingCode?: string | null;
  code?: string | null;
  gtfsId?: GtfsId | null;
  id?: NodeId | null;
  platformCode?: string | null;
  timezone?: string | null;
  alerts?: AlertSummary[] | null;
}

export interface PlanVertex {
  lat: number | null;
  lon: number | null;
  name: string | null;
  vertexType: string | null;
  rentalVehicle?: RentalVehicleRef | null;
  stop?: PlanStopRef | null;
}

export interface IntermediateStop {
  lat: number | null;
  locationType?: string | null;
  lon: number | null;
  name: string | null;
  stopCode?: string | null;
  stopId?: string | null;
}

export interface ElevationProfile {
  distance: number;
  elevation: number;
}

export interface Step {
  absoluteDirection: string | null;
  alerts?: AlertSummary[] | null;
  area: boolean | null;
  distance: number;
  elevationProfile?: ElevationProfile[];
  lat?: number | null;
  lon?: number | null;
  relativeDirection: string | null;
  stayOn?: boolean | null;
  streetName: string | null;
}

export interface RideHailingEstimate {
  arrival?: EpochMillis | null;
  maxPrice?: FarePrice | null;
  minPrice?: FarePrice | null;
  provider?: { id?: string | null } | null;
}

export interface BookingTime {
  daysPrior?: number | null;
}

export interface PickupBookingInfo {
  earliestBookingTime?: BookingTime | null;
}

export interface PlanTripRef {
  wheelchairAccessible?: Accessibility | null;
  bikesAllowed?: Accessibility | null;
  tripShortName?: string | null;
  tripHeadsign?: string | null;
  isThroughCoach?: boolean | null;
  gtfsId?: GtfsId | null;
  id?: NodeId | null;
  alerts?: AlertSummary[] | null;
  arrivalStoptime?: {
    stop?: { gtfsId?: GtfsId | null; id?: NodeId | null; platformCode?: string | null } | null;
    platformColor?: string | null;
    stopPosition?: number | null;
  } | null;
  departureStoptime?: {
    stop?: { gtfsId?: GtfsId | null; id?: NodeId | null; platformCode?: string | null } | null;
    platformColor?: string | null;
    stopPosition?: number | null;
  } | null;
}

export interface PlanRouteRef {
  id?: NodeId | null;
  gtfsId?: GtfsId | null;
  shortName?: string | null;
  longName?: string | null;
  color?: string | null;
  textColor?: string | null;
  type?: number | null;
  alerts?: Alert[] | null;
}

export interface Leg {
  agency: {
    id?: string | null;
    name?: string | null;
    timezone?: string | null;
    url?: string | null;
    alerts?: AlertSummary[] | null;
  } | null;
  fareProducts: FareProduct[];
  accessibilityScore: number | null;
  arrivalDelay: number | null;
  departureDelay: number | null;
  distance: number;
  dropoffType?: PickupDropoffType | null;
  pickupType?: PickupDropoffType | null;
  duration: number;
  endTime: EpochMillis;
  startTime: EpochMillis;
  boardingPlatformColor?: string | null;
  alightingPlatformColor?: string | null;
  infoServices?: InfoService[] | null;
  from: PlanVertex;
  to: PlanVertex;
  headsign?: string | null;
  interlineWithPreviousLeg?: boolean | null;
  intermediateStops: IntermediateStop[];
  legGeometry?: PolylineGeometry | null;
  mode: Mode | null;
  pickupBookingInfo?: PickupBookingInfo | null;
  realTime?: boolean | null;
  realtimeState?: RealtimeState | null;
  rentedBike?: boolean | null;
  rideHailingEstimate?: RideHailingEstimate | null;
  route?: PlanRouteRef | null;
  steps: Step[];
  transitLeg: boolean;
  serviceDate?: string | null;
  trip?: PlanTripRef | null;
}

export interface Itinerary {
  accessibilityScore: number | null;
  duration: number;
  numberOfTransfers: number;
  trackClosure: boolean | null;
  endTime: EpochMillis;
  startTime: EpochMillis;
  waitingTime: number;
  walkTime: number;
  legs: Leg[];
}

export interface RoutingWarning {
  code?: string | null;
  description?: string | null;
}

export interface RoutingWarningWithCode {
  code?: string | null;
  description?: string | null;
  pricingWarningCode?: string | null;
}

export interface RoutingError {
  code?: string | null;
  description?: string | null;
  inputField?: string | null;
}

/** Result of the `plan(...)` mutation-like query. */
export interface PlanResult {
  itineraries: Itinerary[];
  routingWarnings?: RoutingWarning[] | null;
  routingWarningsWithCode?: RoutingWarningWithCode[] | null;
  routingErrors?: RoutingError[] | null;
  nextPageCursor?: string | null;
  previousPageCursor?: string | null;
}

/** Additional optional plan query config. */
export interface PlanContext {
  language?: Language;
}
