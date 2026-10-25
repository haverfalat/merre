import { stopAppearance } from '@/lib/stop-appearance';
import { validCoordinates } from '@/lib/transit';
import { cleanTransitPlaceName } from '@/lib/transit/labels';
import type { GroupedChildStop } from '@/lib/transit/types/stop';
import type { Feature, FeatureCollection, Point } from 'geojson';
import { stopRingId } from '~/features/map/stop-sprite';

export function stopFeatures(
  stops: GroupedChildStop[],
  selectedIds: string[],
  zoom = 12,
  theme: 'dark' | 'light' = 'dark',
  _tripSelected = false,
): FeatureCollection<Point> {
  const radius = zoom >= 15 ? 11 : zoom >= 14 ? 9 : zoom >= 13 ? 7 : 5;
  const seen = new Set<string>();
  return {
    type: 'FeatureCollection',
    features: stops.flatMap((stop): Feature<Point>[] => {
      const id = stop.gtfsId || stop.id;
      if (!id || seen.has(id) || !validCoordinates(stop.lon, stop.lat)) return [];
      seen.add(id);
      const appearance = stopAppearance(stop);
      const selected = selectedIds.includes(id);
      const dark = theme === 'dark';
      return [
        {
          type: 'Feature',
          id,
          geometry: { type: 'Point', coordinates: [stop.lon!, stop.lat!] },
          properties: {
            kind: 'stop',
            stopId: id,
            name: cleanTransitPlaceName(stop.name),
            mode: appearance.icon === 'stop' ? null : stop.routes?.[0]?.mode,
            icon: `stop-icon-${appearance.icon}-${theme}`,
            ring: stopRingId(appearance.colors, dark, false),
            ringSize: (radius * 2 + 6) / 64,
            color: appearance.colors[0],
            colors: appearance.colors,
            bearing: appearance.bearing,
            radius,
            showHeading: appearance.bearing != null,
            headingOffset: [0, (-(radius + 4) * 64) / 10],
            selected,
            journey: false,
            showName: false,
            label: cleanTransitPlaceName(stop.name),
            labelOffset: [(radius + (appearance.bearing != null ? 12 : 7)) / 11, 0],
            background: dark ? '#0f172a' : '#ffffff',
            textColor: dark ? '#f1f5f9' : '#0f172a',
          },
        },
      ];
    }),
  };
}

export function journeyStopFeatures(
  stops: {
    id?: string | null;
    gtfsId?: string | null;
    name?: string | null;
    lon?: number | null;
    lat?: number | null;
    time?: string;
  }[],
  color: string,
  theme: 'dark' | 'light',
  selectedIds: string[],
): FeatureCollection<Point> {
  const seen = new Set<string>();
  const valid = stops.filter(
    (stop) => (stop.gtfsId || stop.id) && validCoordinates(stop.lon, stop.lat),
  );
  return {
    type: 'FeatureCollection',
    features: valid.flatMap((stop, index): Feature<Point>[] => {
      const id = (stop.gtfsId || stop.id)!;
      const featureId = seen.has(id) ? `${id}-visit-${index}` : id;
      seen.add(id);
      const terminal = index === 0 || index === valid.length - 1;
      return [
        {
          type: 'Feature',
          id: featureId,
          geometry: { type: 'Point', coordinates: [stop.lon!, stop.lat!] },
          properties: {
            kind: 'stop',
            stopId: id,
            name: cleanTransitPlaceName(stop.name),
            label: [cleanTransitPlaceName(stop.name), stop.time].filter(Boolean).join('\n'),
            radius: terminal ? 6 : 4,
            color,
            colors: [color],
            bearing: null,
            journey: true,
            terminal,
            selected: selectedIds.includes(id),
            showName: true,
            background: theme === 'dark' ? '#0f172a' : '#ffffff',
            textColor: theme === 'dark' ? '#e8ecf1' : '#0f172a',
          },
        },
      ];
    }),
  };
}
