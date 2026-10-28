import type { ExpressionSpecification } from '@maplibre/maplibre-gl-style-spec';

/** The pointer straddles the outline: its root stays inside, only its tip protrudes. */
export const POINTER_IMAGE_UNIT = 8;
const MARKER_POINTER = { root: 0.4, tip: 0.85, halfWidth: 0.55 } as const;

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

/** Keep billboard labels upright while attaching the map-aligned tip to their actual edge. */
export function vehicleHeadingOffset(bearing = 0): ExpressionSpecification {
  const bindings: [string, ExpressionSpecification][] = [
    ['angle', ['*', ['-', ['get', 'heading'], bearing], Math.PI / 180]],
    ['dx', ['max', 0.000001, ['abs', ['sin', ['var', 'angle']]]]],
    ['dy', ['max', 0.000001, ['abs', ['cos', ['var', 'angle']]]]],
    ['w', ['/', ['get', 'bodyWidth'], 2]],
    ['h', ['/', ['get', 'bodyHeight'], 2]],
    ['r', ['get', 'bodyRadius']],
    ['cx', ['-', ['var', 'w'], ['var', 'r']]],
    ['cy', ['-', ['var', 'h'], ['var', 'r']]],
    ['dot', ['+', ['*', ['var', 'dx'], ['var', 'cx']], ['*', ['var', 'dy'], ['var', 'cy']]]],
    ['edge', [
      'case',
      ['!', ['get', 'showLabel']], ['/', ['get', 'size'], 2],
      ['<=', ['*', ['/', ['var', 'w'], ['var', 'dx']], ['var', 'dy']], ['var', 'cy']],
      ['/', ['var', 'w'], ['var', 'dx']],
      ['<=', ['*', ['/', ['var', 'h'], ['var', 'dy']], ['var', 'dx']], ['var', 'cx']],
      ['/', ['var', 'h'], ['var', 'dy']],
      ['+', ['var', 'dot'], ['sqrt', ['max', 0, [
        '+',
        ['-', ['*', ['var', 'dot'], ['var', 'dot']], ['+', ['*', ['var', 'cx'], ['var', 'cx']], ['*', ['var', 'cy'], ['var', 'cy']]]],
        ['*', ['var', 'r'], ['var', 'r']],
      ]]]],
    ]],
  ];
  // Interpolation constructs the numeric [x, y] array without per-frame GeoJSON updates.
  const result: ExpressionSpecification = ['interpolate', ['linear'],
    ['*', ['+', ['var', 'edge'], ['/', ['get', 'outlineWidth'], 2]], ['/', POINTER_IMAGE_UNIT, ['get', 'headingSize']]],
    0, ['literal', [0, 0]],
    4096, ['literal', [0, -4096]],
  ];
  return bindings.reduceRight<ExpressionSpecification>((scope, [name, value]) => ['let', name, value, scope], result);
}
