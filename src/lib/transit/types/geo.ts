import type { Mode, TransitId } from './common';

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
  features: (GeoJsonFeature<StationSearchProperties> & {
    id: TransitId;
  })[];
}

export interface SearchTripSummary {
  id: string | null;
  gtfsId: string | null;
  tripHeadsign: string | null;
  tripShortName: string | null;
  route?: {
    id?: string | null;
    gtfsId?: string | null;
    agency?: {
      id?: string | null;
      gtfsId?: string | null;
      name?: string | null;
    } | null;
    longName?: string | null;
    shortName?: string | null;
    mode?: Mode | null;
    type?: number | null;
    color?: string | null;
    textColor?: string | null;
  } | null;
}
