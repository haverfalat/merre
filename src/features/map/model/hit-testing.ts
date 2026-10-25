import type { Feature } from 'geojson';

export function nearestMapFeature<T extends Feature>(
  features: T[],
  point: [number, number],
  project?: (coordinates: number[]) => [number, number],
): T | undefined {
  let nearest: T | undefined;
  let distance = Infinity;
  const longitudeScale = project ? 1 : Math.cos((point[1] * Math.PI) / 180);
  for (const feature of features) {
    if (feature.geometry?.type !== 'Point') continue;
    const coordinates = project
      ? project(feature.geometry.coordinates)
      : feature.geometry.coordinates;
    const candidate =
      ((coordinates[0] - point[0]) * longitudeScale) ** 2 + (coordinates[1] - point[1]) ** 2;
    if (candidate < distance) {
      nearest = feature;
      distance = candidate;
    }
  }
  return nearest;
}
