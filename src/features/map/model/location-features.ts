import { validCoordinates } from '@/lib/transit';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { emptyCollection } from './geojson';

export function locationFeatures(
  position: {
    coords: {
      longitude: number;
      latitude: number;
      accuracy: number | null;
    };
  } | null,
  heading: number | null = null,
): FeatureCollection<Geometry> {
  if (!position || !validCoordinates(position.coords.longitude, position.coords.latitude))
    return emptyCollection();
  const { longitude: lon, latitude: lat, accuracy } = position.coords;
  const radius = Math.max(
    1,
    Math.min(accuracy != null && Number.isFinite(accuracy) ? accuracy : 1, 50000),
  );
  const ring = Array.from({ length: 65 }, (_, i) => {
    const angle = (i / 64) * Math.PI * 2;
    return [
      lon + (Math.cos(angle) * radius) / (111195 * Math.cos((lat * Math.PI) / 180)),
      lat + (Math.sin(angle) * radius) / 111195,
    ];
  });
  ring[ring.length - 1] = [...ring[0]];
  const features: Feature<Geometry>[] = [
    {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: { kind: 'accuracy' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: { kind: 'position' },
    },
  ];
  if (heading != null && Number.isFinite(heading) && heading >= 0) {
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: { kind: 'heading', heading: heading % 360 },
    });
  }
  return { type: 'FeatureCollection', features };
}
