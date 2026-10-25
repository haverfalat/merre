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
  const positions: number[][] = collection.features.flatMap((f) =>
    f.geometry.type === 'LineString'
      ? f.geometry.coordinates
      : f.geometry.type === 'Point'
        ? [f.geometry.coordinates]
        : [],
  );
  const points = positions.filter(([lon, lat]) => validCoordinates(lon, lat));
  if (!points.length) return undefined;
  return [
    Math.min(...points.map((p) => p[0])),
    Math.min(...points.map((p) => p[1])),
    Math.max(...points.map((p) => p[0])),
    Math.max(...points.map((p) => p[1])),
  ];
}
