import { themes } from '~/lib/theme';
import type { FeatureCollection, Point } from 'geojson';
import { lineFeature, featureBounds } from '~/features/map/model/geojson';
import { journeyStopFeatures } from '~/features/map/model/stop-features';
import { getMapRouteColor } from '~/lib/transit/colors';
import type { Journey, JourneyEndpoint } from '~/lib/transit/types/plan';
import { journeyTime } from './journey';

export function journeyMap(
  journey: Journey | undefined,
  theme: 'dark' | 'light',
  endpoints: (JourneyEndpoint | null)[],
) {
  const paths: FeatureCollection = { type: 'FeatureCollection', features: [] };
  const stops: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };
  if (journey) {
    for (const [index, leg] of journey.legs.entries()) {
      const color = leg.transit
        ? getMapRouteColor(leg.mode, leg.routeColor, theme)
        : theme === 'dark'
          ? '#a8b8cd'
          : '#52647b';
      const approximate = leg.coordinates.length < 2;
      const line = lineFeature(
        approximate
          ? [leg.from, ...leg.intermediateStops, leg.to].map((point) => [point.lon!, point.lat!])
          : leg.coordinates,
        color,
        `journey-leg-${index}`,
      );
      if (line) {
        line.properties = {
          ...line.properties,
          outline: theme === 'dark' ? '#0f172a' : '#ffffff',
          walking: !leg.transit,
          dashed: !leg.transit || approximate,
          legIndex: index,
        };
        paths.features.push(line);
      }
      const points = journeyStopFeatures(
        [
          {
            ...leg.from,
            id: leg.from.stopId || `journey-from-${index}`,
            time: journeyTime(leg.startTime),
          },
          { ...leg.to, id: leg.to.stopId || `journey-to-${index}`, time: journeyTime(leg.endTime) },
        ],
        color,
        theme,
        [],
      );
      for (const [pointIndex, feature] of points.features.entries()) {
        const previous = stops.features.at(-1);
        const samePosition =
          previous &&
          pointIndex === 0 &&
          previous.properties?.name === feature.properties?.name &&
          previous.geometry.coordinates.every(
            (value, i) => Math.abs(value - feature.geometry.coordinates[i]) < 0.00001,
          );
        if (samePosition && previous.properties) {
          const time = journeyTime(leg.startTime);
          if (!previous.properties.label.endsWith(time)) previous.properties.label += ` → ${time}`;
          previous.properties.legIndex = index;
          continue;
        }
        const terminal =
          (index === 0 && pointIndex === 0) ||
          (index === journey.legs.length - 1 && pointIndex === 1);
        feature.id = `${index}-${feature.id}`;
        feature.properties = {
          ...feature.properties,
          kind: 'journey',
          legIndex: index,
          terminal,
          radius: terminal ? 6 : 5,
        };
        stops.features.push(feature);
      }
    }
  } else {
    stops.features = journeyStopFeatures(
      endpoints.flatMap((point, index) => (point ? [{ ...point, id: `endpoint-${index}` }] : [])),
      themes[theme].accent,
      theme,
      [],
    ).features.map((feature) => ({
      ...feature,
      properties: { ...feature.properties, kind: 'journey' },
    }));
  }
  return {
    paths,
    stops,
    bounds: featureBounds({
      type: 'FeatureCollection',
      features: [...paths.features, ...stops.features],
    }),
  };
}
