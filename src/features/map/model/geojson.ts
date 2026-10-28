import { validCoordinates } from '@/lib/transit';
import type { Feature, FeatureCollection } from 'geojson';

export const emptyCollection = (): FeatureCollection => ({
  type: 'FeatureCollection',
  features: [],
});

export function lineFeature(coordinates: number[][], color: string, id: string): Feature | null {
  const points = coordinates.filter(([lon, lat]) => validCoordinates(lon, lat));
  return points.length >= 2
    ? {
        type: 'Feature',
        id,
        geometry: { type: 'LineString', coordinates: points },
        properties: { color },
      }
    : null;
}

export function featureBounds(
  collection: FeatureCollection,
): [number, number, number, number] | undefined {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  for (const { geometry } of collection.features) {
    const points = geometry.type === 'LineString' ? geometry.coordinates
      : geometry.type === 'Point' ? [geometry.coordinates] : [];
    for (const [lon, lat] of points) {
      if (!validCoordinates(lon, lat)) continue;
      west = Math.min(west, lon);
      south = Math.min(south, lat);
      east = Math.max(east, lon);
      north = Math.max(north, lat);
    }
  }
  return west === Infinity ? undefined : [west, south, east, north];
}
