import { STOP_LABEL_STYLE as labelStyle } from './stop-label-style';
import { validCoordinates } from '@/lib/transit';
import type { Feature, Point } from 'geojson';
import type { MapPadding } from './model/camera-padding';

type Rect = { left: number; right: number; top: number; bottom: number };
export interface StopLabel {
  feature: Feature<Point>;
  text: string;
  width: number;
  height: number;
  offset: [number, number];
}
const overlaps = (a: Rect, b: Rect) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
function world([lon, lat]: number[], zoom: number) {
  const size = 512 * 2 ** zoom;
  const sine = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return [
    ((lon + 180) / 360) * size,
    (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * size,
  ];
}
function wrap(text: string) {
  return text.split('\n').flatMap((line) => {
    const result: string[] = [];
    let current = '';
    for (const word of line.split(' ')) {
      if (current && (current + word).length > labelStyle.wrapCharacters) {
        result.push(current);
        current = '';
      }
      current += (current ? ' ' : '') + word;
    }
    if (current) result.push(current);
    return result;
  });
}
/** Native MapKit/Google annotations need explicit collision and panel avoidance. */
export function layoutStopLabels(
  features: Feature<Point>[],
  center: [number, number],
  zoom: number,
  width: number,
  height: number,
  bearing: number,
  padding: MapPadding,
): StopLabel[] {
  if (!width || !height || !validCoordinates(...center)) return [];
  const origin = world(center, zoom);
  const angle = (bearing * Math.PI) / 180;
  const projected = features.map((feature) => {
    const point = world(feature.geometry.coordinates, zoom);
    let dx = point[0] - origin[0];
    const size = 512 * 2 ** zoom;
    if (dx > size / 2) dx -= size;
    if (dx < -size / 2) dx += size;
    const dy = point[1] - origin[1];
    return {
      feature,
      x: width / 2 + dx * Math.cos(angle) + dy * Math.sin(angle),
      y: height / 2 - dx * Math.sin(angle) + dy * Math.cos(angle),
    };
  });
  const occupied: Rect[] = projected.map(({ x, y, feature }) => ({
    left: x - feature.properties!.radius - 3,
    right: x + feature.properties!.radius + 3,
    top: y - feature.properties!.radius - 3,
    bottom: y + feature.properties!.radius + 3,
  }));
  const bounds = {
    left: padding.left,
    right: width - padding.right,
    top: padding.top,
    bottom: height - padding.bottom,
  };
  const labels: StopLabel[] = [];
  const candidates = projected
    .filter((p) => p.feature.properties?.showName)
    .sort(
      (a, b) =>
        Number(b.feature.properties?.selected) - Number(a.feature.properties?.selected) ||
        Number(b.feature.properties?.terminal) - Number(a.feature.properties?.terminal),
    );
  for (const { feature, x, y } of candidates) {
    if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) continue;
    const p = feature.properties!;
    const lines = wrap(p.label);
    const labelWidth = Math.min(
      labelStyle.maxWidth,
      Math.max(
        35,
        ...lines.map(
          (line) => line.length * labelStyle.characterWidth + labelStyle.horizontalPadding,
        ),
      ),
    );
    const labelHeight = lines.length * labelStyle.lineHeight + labelStyle.verticalPadding;
    const offsets: [number, number][] = p.journey
      ? [
          [0, -labelHeight / 2 - 18],
          [labelWidth / 2 + 18, 0],
          [-labelWidth / 2 - 18, 0],
          [0, labelHeight / 2 + 18],
        ]
      : [[labelWidth / 2 + p.radius + (p.bearing != null ? 12 : 7), 0]];
    for (const offset of offsets) {
      const rect = {
        left: x + offset[0] - labelWidth / 2,
        right: x + offset[0] + labelWidth / 2,
        top: y + offset[1] - labelHeight / 2,
        bottom: y + offset[1] + labelHeight / 2,
      };
      if (
        rect.left < bounds.left ||
        rect.right > bounds.right ||
        rect.top < bounds.top ||
        rect.bottom > bounds.bottom ||
        occupied.some((other) => overlaps(rect, other))
      )
        continue;
      labels.push({
        feature,
        text: lines.join('\n'),
        width: labelWidth,
        height: labelHeight,
        offset,
      });
      occupied.push(rect);
      break;
    }
  }
  return labels;
}
