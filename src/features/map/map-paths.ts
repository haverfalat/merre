import { stopConnections } from '@/lib/stop-connections';
import type { DecodedTripDetail } from '@/lib/transit/client';
import { getMapRouteColor, getRouteColor } from '@/lib/transit/colors';
import type { StopConnectionsResponse } from '@/lib/transit/types/connections';
import type { RouteDetail, RoutePattern } from '@/lib/transit/types/route';
import type { Feature, FeatureCollection } from 'geojson';
import { lineFeature } from '~/features/map/model/geojson';

interface MapPathInput {
  route: RouteDetail | null | undefined;
  pattern: RoutePattern | undefined;
  trip: DecodedTripDetail | null | undefined;
  connections: StopConnectionsResponse | null | undefined;
  stopId: string | null;
  stopIds: string[];
  selectedRoutes: string[] | null;
  showConnections: boolean;
  theme: 'dark' | 'light';
}

export function mapPaths({
  route,
  pattern,
  trip,
  connections,
  stopId,
  stopIds,
  selectedRoutes,
  showConnections,
  theme,
}: MapPathInput): FeatureCollection {
  const features: Feature[] = [];
  const routeColor = getMapRouteColor(
    route?.mode ?? undefined,
    getRouteColor(route?.mode, route?.color, route?.textColor).primary,
    theme,
  );
  if (pattern) {
    let coordinates: number[][] = pattern.stops?.map((s) => [s.lon!, s.lat!]) ?? [];
    if (pattern.coordinates?.length) coordinates = pattern.coordinates;
    const line = lineFeature(coordinates, routeColor, 'route');
    if (line) features.push(line);
  }
  if (trip) {
    const line = lineFeature(
      trip.decodedPolyline.length
        ? trip.decodedPolyline.map(([lat, lon]) => [lon, lat])
        : (trip.stoptimes?.length
            ? trip.stoptimes.map((time) => time.stop)
            : (trip.pattern?.stops ?? [])
          ).map((stop) => [stop.lon!, stop.lat!]),
      getMapRouteColor(
        trip.route?.mode ?? undefined,
        getRouteColor(trip.route?.mode, trip.route?.color, trip.route?.textColor).primary,
        theme,
      ),
      'trip',
    );
    if (line) features.push(line);
  }
  if (stopId && showConnections)
    for (const connection of stopConnections(
      connections,
      stopIds.length ? stopIds : stopId,
      selectedRoutes,
    )) {
      const line = lineFeature(
        connection.coordinates,
        getMapRouteColor(
          connection.route.mode ?? undefined,
          getRouteColor(connection.route.mode, connection.route.color, connection.route.textColor)
            .primary,
          theme,
        ),
        connection.id,
      );
      if (line) features.push(line);
    }
  for (const feature of features)
    feature.properties = {
      ...feature.properties,
      outline: theme === 'dark' ? '#0f172a' : '#ffffff',
    };
  return { type: 'FeatureCollection', features };
}
