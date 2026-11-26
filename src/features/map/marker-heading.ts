import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

/** Tangent teardrop pointer for circular vehicle markers: sides meet the circle smoothly at 360°. */
export const POINTER_IMAGE_UNIT = 16;
const MARKER_POINTER = { root: 0.35, tip: 0.62, halfWidth: 0.68 } as const;

export function roundedMarkerEdge(width: number, height: number, radius: number, heading: number) {
  const angle = heading * Math.PI / 180;
  const x = Math.max(0.000001, Math.abs(Math.sin(angle)));
  const y = Math.max(0.000001, Math.abs(Math.cos(angle)));
  const w = width / 2, h = height / 2;
  const r = Math.min(radius, w, h);
  if (w / x * y <= h - r) return w / x;
  if (h / y * x <= w - r) return h / y;
  const cx = w - r, cy = h - r;
  const dot = x * cx + y * cy;
  return dot + Math.sqrt(Math.max(0, dot * dot - cx * cx - cy * cy + r * r));
}

/** Same triangle as the SDF asset, in screen pixels for the Expo Go SVG renderer. */
export function markerPointerPath(heading: number, distance: number, size: number) {
  const angle = heading * Math.PI / 180;
  const x = Math.sin(angle), y = -Math.cos(angle);
  const point = (forward: number, side: number) =>
    `${x * forward - y * side},${y * forward + x * side}`;
  return `M${point(distance + size * MARKER_POINTER.tip, 0)} ` +
    `L${point(distance - size * MARKER_POINTER.root, size * MARKER_POINTER.halfWidth)} ` +
    `L${point(distance - size * MARKER_POINTER.root, -size * MARKER_POINTER.halfWidth)} Z`;
}

/** Keep billboard labels upright while attaching the tangent teardrop tip to the circular body. */
export function vehicleHeadingOffset(_bearing = 0): ExpressionSpecification {
  return [
    'interpolate',
    ['linear'],
    ['*', ['*', ['get', 'size'], 0.375], ['/', POINTER_IMAGE_UNIT, ['get', 'headingSize']]],
    0,
    ['literal', [0, 0]],
    4096,
    ['literal', [0, -4096]],
  ];
}
