import type { ClientCore } from './core';
import { NEAREST_QUERY } from './queries';
import type {
  NearestResult,
  NearestRequest,
  StationSearchResult,
  GeoJsonFeatureCollection,
  GeocodeOptions,
} from '../types/geo';

const DEFAULT_BBOX: [number, number, number, number] = [16, 45.273, 23, 48.7];

/** Geocoding + nearby places. */
export function createGeoApi(core: ClientCore) {
  /** Places (stops, car parks, rental vehicles, ...) nearest to a coordinate. */
  async function nearest(request: NearestRequest): Promise<NearestResult> {
    const variables: Record<string, unknown> = {
      lat: request.lat,
      lon: request.lon,
      maxDistance: request.maxDistance ?? 450,
      maxResults: request.maxResults ?? 50,
      filterByPlaceTypes: request.filterByPlaceTypes,
    };
    const res = await core.graphql<{ nearest: NearestResult }>(NEAREST_QUERY, variables, 'Nearest');
    return res.data!.nearest;
  }

  /**
   * Search stations / stops by name (the OTP station index, not OSM).
   * Returns a GeoJSON FeatureCollection whose features have an `id` that can
   * be used directly as a `gtfsId` place reference.
   *
   * @example
   * await futar.geocodeStations('keleti');
   */
  async function geocodeStations(
    query: string,
    options: { limit?: number; lang?: string } = {},
  ): Promise<StationSearchResult> {
    return core.transport.getJson<StationSearchResult>(
      `/otp2-backend/otp/routers/${core.config.router}/geocode/stations`,
      {
        q: query,
        limit: options.limit ?? 10,
        lang: options.lang ?? core.language,
      },
    );
  }

  /**
   * Full OSM geocoding (photon). Finds streets, cities and POIs, not just stops.
   *
   * @example
   * await futar.geocode('keleti pályaudvar');
   */
  async function geocode(
    query: string,
    options: GeocodeOptions = {},
  ): Promise<GeoJsonFeatureCollection> {
    return core.transport.getJson<GeoJsonFeatureCollection>('/photon/api', {
      q: query,
      limit: options.limit ?? 10,
      lang: (options.lang ?? core.language).split('-')[0],
      bbox: options.bbox ? options.bbox.join(',') : undefined,
      osm_tag: options.osmTag,
      location_bias_scale: options.locationBiasScale ?? 0.1,
      zoom: options.zoom ?? 12,
      ...(options.bbox ? {} : { bbox: DEFAULT_BBOX.join(',') }),
    });
  }

  return { nearest, geocodeStations, geocode };
}

export type GeoApi = ReturnType<typeof createGeoApi>;
