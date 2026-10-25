import type { GtfsId, NodeId, Mode, I18nText, Language } from './common';
import type { StopGroupResult } from './stop';

/** A transit agency (operator). */
export interface Agency {
  id?: NodeId | string | null;
  gtfsId?: GtfsId | null;
  name: string;
  url?: string | null;
  timezone?: string | null;
  lang?: string | null;
  fareUrl?: string | null;
  uicCode?: string | null;
  phone?: string | null;
}

/** A country served by the network (for fare/pricing areas). */
export interface Country {
  isoCode: string;
  name: string;
  nameI18n?: I18nText[] | null;
}

/** Comfort level options returned by `planParameters` (e.g. 1st/2nd class). */
export interface ComfortLevel {
  fareUicCode: string;
  name: string;
  nameI18n: I18nText[];
  listOrder: number | null;
  mandatoryPlaceReservation: boolean;
  pricingArea: 'DOMESTIC' | 'INTERNATIONAL' | 'BOTH' | null;
}

export interface SalesServiceGroup {
  name: string;
  code: string;
}

export interface SalesServiceGroupRef {
  salesGroupId: string;
  salesGroupName: string;
  salesGroupNameI18n: I18nText[];
  salesServices: SalesServiceGroup[];
}

export interface ComfortLevelCategory {
  name: string;
  nameI18n: I18nText[];
  comfortLevels: ComfortLevel[];
  reservationSSMainGroups: {
    salesMainGroupId: string;
    salesMainGroupName: string;
    salesMainGroupNameI18n: I18nText[];
    salesServiceGroups: SalesServiceGroupRef[];
  }[];
}

export interface SearchParameter {
  code: string;
  iconFontCharset: string | null;
  iconFontCode: number | null;
  order: number | null;
  disablerComfortLevels: { fareUicCode: string }[];
  nameI18n: I18nText[];
}

export interface SearchParameterGroup {
  filterType: string;
  groupName: I18nText[];
  iconFile: string | null;
  order: number | null;
  searchParameters: SearchParameter[];
}

/** Result of `planParameters(...)`. */
export interface PlanParameters {
  comfortLevelCategories: ComfortLevelCategory[];
  searchParameterGroups: SearchParameterGroup[];
}

/** A place type used in `nearest(...)` filter. */
export type FilterPlaceType =
  | 'STOP'
  | 'STATION'
  | 'STOP_CLUSTER'
  | 'CAR_PARK'
  | 'BIKE_PARK'
  | 'VEHICLE_RENT'
  | 'BIKE_RENT'
  | 'BIKE_SWAP'
  | 'VEHICLE_RENTAL_STATION'
  | 'RENTAL_VEHICLE'
  | 'DEPARTURE_ROW';

export interface RentalVehiclePlace {
  id?: string | null;
  network?: string | null;
  vehicleType?: { formFactor?: string | null } | null;
}

export interface VehicleRentalStationPlace {
  network?: string | null;
}

export interface BikeRentalStationPlace {
  bikesAvailable?: number | null;
  spacesAvailable?: number | null;
  name?: string | null;
  networks?: string[] | null;
}

export interface VehicleParkingPlace {
  carPlaces?: number | null;
  bicyclePlaces?: number | null;
  name?: string | null;
}

export interface NearestPlace {
  id: string;
  lat: number;
  lon: number;
  __typename?: string;
  rentalVehicle?: RentalVehiclePlace | null;
  vehicleRentalStation?: VehicleRentalStationPlace | null;
  bikeRentalStation?: BikeRentalStationPlace | null;
  vehicleParking?: VehicleParkingPlace | null;
}

export interface NearestNode {
  place: NearestPlace;
  distance: number;
}

export interface NearestEdge {
  node: NearestNode;
}

export interface NearestResult {
  edges: NearestEdge[];
}

export interface NearestRequest {
  lat: number;
  lon: number;
  maxDistance?: number;
  maxResults?: number;
  filterByPlaceTypes?: FilterPlaceType[];
}

/** Parameters for the `stopGroupsByRadius` query. */
export interface StopGroupsByRadiusRequest {
  lat: number;
  lon: number;
  /** Radius in meters. */
  radius?: number;
  /** Center stop id to exclude. */
  stopId?: string;
  /** Exclude the given stop cluster id. */
  ignoredStopClusterId?: string;
  /** Exclude the given stop group id. */
  ignoredStopGroupId?: string;
  startTime?: number;
  numberOfDepartures?: number;
}

/** GeoJSON feature returned by the station / photon geocoders. */
export interface GeoJsonFeature<TProperties = Record<string, unknown>> {
  type: 'Feature';
  properties: TProperties;
  geometry: {
    type: 'Point' | string;
    coordinates: [number, number];
  };
  id?: string;
}

export interface GeoJsonFeatureCollection<TProperties = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoJsonFeature<TProperties>[];
}

/** Properties of a station-search feature (geocode/stations). */
export interface StationSearchProperties {
  score: number;
  internationalPriced: number;
  modes: Mode[];
  code: string | null;
  countryIsoCode: string;
  name: string;
  domesticPriced: number;
  type: string;
}

export interface StationSearchResult extends GeoJsonFeatureCollection<StationSearchProperties> {
  features: (GeoJsonFeature<StationSearchProperties> & { id: GtfsId })[];
}

export interface GeocodeOptions {
  /** Number of results. */
  limit?: number;
  /** Language for the returned names. */
  lang?: Language;
  /** Bounding box `minLon,minLat,maxLon,maxLat`. */
  bbox?: [number, number, number, number];
  /** Photon OSM tag filter, e.g. `!place:region`. */
  osmTag?: string;
  /** Location bias strength (photon). */
  locationBiasScale?: number;
  /** Zoom bias (photon). */
  zoom?: number;
}

export type StopGroupRadiusResult = StopGroupResult;

/** A trip returned by `searchTrips`. */
export interface SearchTripSummary {
  id: string | null;
  gtfsId: string | null;
  tripHeadsign: string | null;
  tripShortName: string | null;
  route?: {
    id?: string | null;
    gtfsId?: string | null;
    agency?: { id?: string | null; gtfsId?: string | null; name?: string | null } | null;
    longName?: string | null;
    shortName?: string | null;
    mode?: Mode | null;
    type?: number | null;
    color?: string | null;
    textColor?: string | null;
  } | null;
}

export interface SearchTripsResult {
  searchTrips: SearchTripSummary[];
}

export interface SearchTripsRequest {
  searchString: string;
  modes?: Mode[];
  agencyIds?: string[];
  countryIsoCodes?: string[];
  date?: string;
}
