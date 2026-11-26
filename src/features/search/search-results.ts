import { isPlateQuery, normalizePlate } from '@/lib/transit/search/plates';
import { filterRoutes } from '@/lib/transit/search/routes';
import type { CompoundRouteStopMatch } from '@/lib/transit/search/compound';
import { useStopPreview } from '~/store/useStopPreview';

import type { TranslationKey } from '@/i18n/dict';
import {
  insideViewport,
  normalizeSearchText,
  rankSearchResults,
  type SearchCandidate,
} from '@/lib/search-relevance';
import { validCoordinates } from '@/lib/transit';
import { getRouteColor } from '@/lib/transit/colors';
import { cleanTransitLabel, cleanTransitPlaceName } from '@/lib/transit/labels';
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
  prefetch?: import('~/hooks/useTransitPrefetch').TransitIntent;
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
  now: number;
  exactPositions: { id: string; position: VehiclePosition }[];
  compoundMatches?: CompoundRouteStopMatch[];
  stations: StationSearchResult | null | undefined;
  trips: SearchTripSummary[] | undefined;
  places: GeoJsonFeatureCollection | undefined;
  routes: RouteSummary[] | undefined;
  terminals: Map<string, string | null | undefined>;
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
  now,
  exactPositions,
  compoundMatches,
  stations,
  trips,
  places,
  routes,
  terminals,
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
  const liveTrips = new Set<string>();
  for (const { id, position } of exactPositions) {
    const age = position.lastUpdated != null ? now / 1000 - position.lastUpdated : Infinity;
    if (age >= 0 && age <= 120 && validCoordinates(position.lon, position.lat)) liveTrips.add(id);
  }
  for (const stop of stops ?? [])
    if (insideViewport([stop.lon!, stop.lat!], bounds))
      for (const route of stop.routes ?? []) positions.set(route.id, [stop.lon!, stop.lat!]);
  for (const vehicle of vehicles ?? []) {
    const point: [number, number] = [vehicle.lon!, vehicle.lat!];
    const id = vehicle.trip?.gtfsId || vehicle.trip?.id;
    if (id && vehicle.lastUpdated != null && now / 1000 - vehicle.lastUpdated >= 0 &&
      now / 1000 - vehicle.lastUpdated <= 120 &&
      vehicle.trip?.serviceDate?.replaceAll('-', '') === date.replaceAll('-', '')) liveTrips.add(id);
    if (!insideViewport(point, bounds)) continue;
    if (id) tripPositions.set(id, point);
    if (vehicle.trip?.route?.id) positions.set(vehicle.trip.route.id, point);
  }
  for (const match of compoundMatches ?? []) {
    const { route, stop, stopId, headsign, score } = match;
    const lon = stop.lon ?? undefined;
    const lat = stop.lat ?? undefined;
    items.push({
      key: `compound-${route.id}-${stopId}-${headsign}`,
      prefetch: { kind: 'stop', id: stopId },
      section: 'stations_stops',
      title: headsign || stop.name || stopId,
      searchName: `${route.shortName || ''} ${stop.name || ''} ${headsign}`,
      routeLabel: route.shortName,
      routeName: route.shortName,
      subtitle: stop.name || undefined,
      mode: route.mode,
      color: getRouteColor(route.mode, route.color, route.textColor).primary,
      position: validCoordinates(lon, lat) ? [lon!, lat!] : undefined,
      boost: score,
      select: () => {
        useStopPreview.setState({
          board: { id: stopId, tab: 'departures', routeFilter: [route.id] },
        });
        store.setSelectedStopId(stopId);
        if (validCoordinates(lon, lat)) store.flyTo([lon!, lat!], 15);
      },
    });
  }
  const queryTokens = normalizeSearchText(query).split(' ').filter((tok) => tok.length >= 2);
  for (const station of stations?.features ?? []) {
    if (!station.id) continue;
    const nearby = groups.get(station.id) ?? [];
    const exact = nearby.filter((stop) => (stop.gtfsId || stop.id) === station.id);
    const servingStops = nearby.length ? nearby : exact;
    const [lon, lat] = station.geometry.coordinates;
    const area = station.properties.type === 'MetaStation';
    const cleanTitle = station.properties.name.replace(/\*$/, '');
    const normStation = normalizeSearchText(cleanTitle);
    const extraTokens = queryTokens.filter((tok) => !normStation.includes(tok));
    const nearbyPlace = (places?.features ?? []).find((place) => {
      const [pLon, pLat] = place.geometry.coordinates;
      return (
        validCoordinates(pLon, pLat) &&
        Math.hypot(lon - pLon, lat - pLat) <= 0.006 &&
        extraTokens.some((tok) =>
          normalizeSearchText(
            `${place.properties.district || ''} ${place.properties.city || ''} ${place.properties.town || ''} ${place.properties.name || ''}`,
          ).includes(tok),
        )
      );
    });
    const patternDirections = new Map<
      string,
      {
        stop: GroupedChildStop;
        stopId: string;
        routeId: string;
        shortName: string;
        mode?: GroupedChildStop['routes'] extends (infer R)[] | null | undefined
          ? R extends { mode?: infer M }
            ? M
            : never
          : never;
        color?: string | null;
        textColor?: string | null;
        headsign: string;
        matchedExtra: boolean;
      }
    >();
    for (const stop of servingStops) {
      const sId = stop.gtfsId || stop.id;
      if (!sId) continue;
      for (const pat of stop.patterns ?? []) {
        const route = pat.route;
        const headsign = cleanTransitPlaceName(pat.headsign || '');
        if (!route?.id || !headsign) continue;
        const normDir = normalizeSearchText(`${route.shortName || ''} ${headsign}`);
        const matchedExtra = extraTokens.length > 0 && extraTokens.some((tok) => normDir.includes(tok));
        const key = `${sId}|${route.id}|${normalizeSearchText(headsign)}`;
        if (!patternDirections.has(key)) {
          patternDirections.set(key, {
            stop,
            stopId: sId,
            routeId: route.id,
            shortName: route.shortName || '?',
            mode: route.mode,
            color: route.color,
            textColor: route.textColor,
            headsign,
            matchedExtra,
          });
        }
      }
    }
    const directionMatches = [...patternDirections.values()].filter(
      (d) => d.matchedExtra || !!nearbyPlace,
    );
    for (const dir of directionMatches) {
      const sLon = dir.stop.lon ?? lon;
      const sLat = dir.stop.lat ?? lat;
      items.push({
        key: `station-dir-${dir.stopId}-${dir.routeId}-${dir.headsign}`,
        prefetch: { kind: 'stop', id: dir.stopId },
        section: 'stations_stops',
        title: dir.headsign,
        searchName: `${cleanTitle} ${dir.shortName} ${dir.headsign} ${nearbyPlace?.properties.district || ''}`,
        routeLabel: dir.shortName,
        routeName: dir.shortName,
        subtitle: cleanTitle,
        mode: dir.mode,
        color: getRouteColor(dir.mode, dir.color, dir.textColor).primary,
        position: [sLon, sLat],
        boost: (dir.matchedExtra ? 1400 : 0) + (nearbyPlace ? 900 : 0),
        select: () => {
          useStopPreview.setState({
            board: { id: dir.stopId, tab: 'departures', routeFilter: [dir.routeId] },
          });
          store.setSelectedStopId(dir.stopId);
          if (validCoordinates(sLon, sLat)) store.flyTo([sLon, sLat], 15);
        },
      });
    }
    items.push({
      key: `stop-${station.id}`,
      prefetch: area ? undefined : { kind: 'stop', id: station.id },
      section: area ? 'places_addresses' : 'stations_stops',
      title: cleanTitle,
      searchName: `${station.properties.name} ${nearbyPlace?.properties.district || ''}`,
      position: [lon, lat],
      boost: nearbyPlace ? 1000 : undefined,
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
      prefetch: { kind: 'route', id: route.id },
      section: 'routes',
      title: terminals.get(route.id) || (route.longName !== route.id ? route.longName : null) || route.shortName || t('routes'),
      routeLabel: route.shortName,
      routeName: route.shortName,
      searchName: `${route.longName || terminals.get(route.id) || ''} ${route.agency?.name || ''}`,
      subtitle: [route.id, route.agency?.name].filter(Boolean).join(' · '),
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
      prefetch: { kind: 'trip', id, day: date },
      serviceName: cleanTransitLabel(trip.tripShortName),
      live: liveTrips.has(id),
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
  if (isPlateQuery(query)) {
    const plate = normalizePlate(query);
    for (const vehicle of vehicles ?? []) {
      if (!vehicle.licensePlate || !normalizePlate(vehicle.licensePlate).includes(plate)) continue;
      const id = vehicle.trip?.gtfsId || vehicle.trip?.id;
      if (!id) continue;
      const route = vehicle.trip?.route;
      items.push({
        key: `plate-${vehicle.vehicleId || id}`,
        prefetch: { kind: 'trip', id, day: vehicle.trip?.serviceDate || date },
        section: 'active_trips',
        title: vehicle.trip?.tripHeadsign || route?.longName || vehicle.licensePlate,
        subtitle: [vehicle.licensePlate, vehicle.vehicleModel].filter(Boolean).join(' · '),
        searchName: normalizePlate(vehicle.licensePlate),
        routeLabel: route?.shortName,
        routeName: route?.shortName,
        mode: route?.mode,
        color: getRouteColor(route?.mode, route?.color, route?.textColor).primary,
        position: validCoordinates(vehicle.lon, vehicle.lat) ? [vehicle.lon!, vehicle.lat!] : undefined,
        frontDoor: hasFrontDoorBoarding(vehicle.trip?.tripHeadsign),
        select: () => {
          store.setSelectedVehicle({ tripId: id, vehicleId: vehicle.vehicleId ?? undefined,
            serviceDay: vehicle.trip?.serviceDate || date,
            frontDoor: hasFrontDoorBoarding(vehicle.trip?.tripHeadsign) });
          if (validCoordinates(vehicle.lon, vehicle.lat)) store.flyTo([vehicle.lon!, vehicle.lat!], 15);
        },
      });
    }
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
