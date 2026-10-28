import type { MapPadding } from '../useMapPadding';

/** Never ask the camera to fit into a zero-sized or fully occluded canvas. */
export function cameraPadding(padding: MapPadding, width: number, height: number): MapPadding | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) return null;
  const fit = (first: number, second: number, size: number) => {
    const a = Number.isFinite(first) ? Math.max(0, first) : 0;
    const b = Number.isFinite(second) ? Math.max(0, second) : 0;
    const available = size - Math.min(96, size / 2);
    const scale = a + b > available ? available / (a + b) : 1;
    return [Math.floor(a * scale), Math.floor(b * scale)];
  };
  const [left, right] = fit(padding.left, padding.right, width);
  const [top, bottom] = fit(padding.top, padding.bottom, height);
  return { top, bottom, left, right };
}
