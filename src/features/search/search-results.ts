import { filterRoutes } from '@/lib/transit/search/routes';

import type { TranslationKey } from '@/i18n/dict';
import { insideViewport, rankSearchResults, type SearchCandidate } from '@/lib/search-relevance';
import { validCoordinates } from '@/lib/transit';
import { getRouteColor } from '@/lib/transit/colors';
import { cleanTransitLabel } from '@/lib/transit/labels';
import type {
  GeoJsonFeatureCollection,
  SearchTripSummary,
  StationSearchResult,
} from '@/lib/transit/types/geo';
import type { RouteSummary } from '@/lib/transit/types/route';
import type { GroupedChildStop } from '@/lib/transit/types/stop';
import type { VehiclePosition } from '@/lib/transit/types/vehicle';
import type { BoundingBox, useMapStore } from '@/store/useMapStore';
import { hasFrontDoorBoarding } from '~/lib/boarding-policy';

export interface SearchResult extends SearchCandidate {
  key: string;
  section: TranslationKey;
  title: string;
  subtitle?: string;
  modes?: string[];
  routes?: RouteSummary[];
  frontDoor?: boolean;
  mode?: string | null;
  routeLabel?: string | null;
  color?: string | null;
  select: () => void;
}
interface SearchSources {
  query: string;
  stations: StationSearchResult | null | undefined;
  trips: SearchTripSummary[] | undefined;
  places: GeoJsonFeatureCollection | undefined;
  routes: RouteSummary[] | undefined;
  groups: Map<string, GroupedChildStop[] | undefined>;
  stops: GroupedChildStop[] | undefined;
  vehicles: VehiclePosition[] | undefined;
  bounds: BoundingBox | null;
  center: [number, number];
  date: string;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  actions: Pick<
    ReturnType<typeof useMapStore.getState>,
    'clearSelection' | 'setSelectedStopId' | 'flyTo' | 'setSelectedRouteId' | 'setSelectedVehicle'
  >;
}

export function buildSearchResults({
  query,
  stations,
  trips,
  places,
  routes,
  groups,
  stops,
  vehicles,
  bounds,
  center,
  date,
  t,
  actions: store,
}: SearchSources): SearchResult[] {
  if (!query) return [];
  const items: SearchResult[] = [];
  const localRoutes = new Map(
    (stops ?? [])
      .filter((stop) => insideViewport([stop.lon!, stop.lat!], bounds))
      .flatMap((stop) => stop.routes ?? [])
      .map((route) => [route.id, route]),
  );
  const positions = new Map<string, [number, number]>();
  const tripPositions = new Map<string, [number, number]>();
  for (const stop of stops ?? [])
    if (insideViewport([stop.lon!, stop.lat!], bounds))
      for (const route of stop.routes ?? []) positions.set(route.id, [stop.lon!, stop.lat!]);
  for (const vehicle of vehicles ?? []) {
    const point: [number, number] = [vehicle.lon!, vehicle.lat!];
    if (!insideViewport(point, bounds)) continue;
    const id = vehicle.trip?.gtfsId || vehicle.trip?.id;
    if (id) tripPositions.set(id, point);
    if (vehicle.trip?.route?.id) positions.set(vehicle.trip.route.id, point);
  }
  for (const station of stations?.features ?? []) {
    if (!station.id) continue;
    const nearby = groups.get(station.id) ?? [];
    const exact = nearby.filter((stop) => (stop.gtfsId || stop.id) === station.id);
    const servingStops = exact.length ? exact : nearby;
    const [lon, lat] = station.geometry.coordinates;
    const area = station.properties.type === 'MetaStation';
    items.push({
      key: `stop-${station.id}`,
      section: area ? 'places_addresses' : 'stations_stops',
      title: station.properties.name.replace(/\*$/, ''),
      searchName: station.properties.name,
      position: [lon, lat],
      mode: area ? null : station.properties.modes?.[0],
      modes: station.properties.modes,
      routes: area
        ? []
        : [
            ...new Map(
              servingStops.flatMap((stop) => stop.routes ?? []).map((route) => [route.id, route]),
            ).values(),
          ],
      select: () => {
        if (area) store.clearSelection();
        else store.setSelectedStopId(station.id);
        if (validCoordinates(lon, lat)) store.flyTo([lon, lat], area ? 12 : 14);
      },
    });
  }
  const candidates = new Map<string, RouteSummary>([
    ...localRoutes,
    ...(routes ?? []).map((r) => [r.id, r] as const),
  ]);
  for (const route of filterRoutes([...candidates.values()], query, Infinity))
    items.push({
      key: `route-${route.id}`,
      section: 'routes',
      title: route.longName || route.id,
      routeLabel: route.shortName,
      routeName: route.shortName,
      searchName: `${route.longName || ''} ${route.agency?.name || ''}`,
      subtitle: route.agency?.name || undefined,
      mode: route.mode,
      color: getRouteColor(route.mode, route.color, route.textColor).primary,
      position: positions.get(route.id),
      nearby: positions.has(route.id),
      select: () => store.setSelectedRouteId(route.id),
    });
  for (const trip of trips ?? []) {
    const id = trip.gtfsId || trip.id;
    if (!id) continue;
    items.push({
      key: `trip-${id}`,
      section: 'active_trips',
      frontDoor: hasFrontDoorBoarding(trip.tripHeadsign),
      title: trip.tripHeadsign || trip.route?.longName || id,
      routeLabel: trip.route?.shortName || trip.tripShortName,
      routeName: trip.route?.shortName || trip.tripShortName,
      searchName: trip.tripHeadsign || trip.route?.longName || '',
      subtitle: [cleanTransitLabel(trip.tripShortName), trip.route?.agency?.name]
        .filter(Boolean)
        .join(' · '),
      mode: trip.route?.mode,
      color: getRouteColor(trip.route?.mode, trip.route?.color, trip.route?.textColor).primary,
      position: tripPositions.get(id),
      nearby: tripPositions.has(id) || positions.has(trip.route?.gtfsId || trip.route?.id || ''),
      select: () =>
        store.setSelectedVehicle({
          tripId: id,
          serviceDay: date,
          frontDoor: hasFrontDoorBoarding(trip.tripHeadsign),
        }),
    });
  }
  for (const [i, place] of (places?.features ?? []).entries()) {
    const [lon, lat] = place.geometry.coordinates;
    if (!validCoordinates(lon, lat)) continue;
    const p = place.properties;
    items.push({
      key: `place-${i}`,
      section: 'places_addresses',
      title: String(p.name || t('unknown_place')),
      searchName: String(p.name || p.street || ''),
      position: [lon, lat],
      subtitle: [p.street, p.housenumber, p.city || p.town].filter(Boolean).join(', '),
      select: () => {
        store.clearSelection();
        store.flyTo([lon, lat], 14);
      },
    });
  }
  return rankSearchResults([...new Map(items.map((item) => [item.key, item])).values()], query, {
    bounds,
    center,
  });
}
