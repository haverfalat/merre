import { vehicleMapZoom } from '@/lib/vehicle-marker';

export function nativeMapRegion(
  center: [number, number],
  zoom: number,
  width: number,
  height: number,
) {
  const longitudeDelta = (360 * Math.max(1, width)) / (512 * 2 ** zoom);
  return {
    longitude: center[0],
    latitude: center[1],
    longitudeDelta,
    latitudeDelta:
      ((longitudeDelta * Math.max(1, height)) / Math.max(1, width)) *
      Math.cos((center[1] * Math.PI) / 180),
  };
}
export function nativeMapZoom(width: number, longitudeDelta: number) {
  const zoom = vehicleMapZoom(width, longitudeDelta);
  return zoom == null ? null : Math.max(5, Math.min(19, zoom));
}

export interface MapPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** MapKit camera centers ignore our JS sheet; offset its center explicitly. */
export function nativeCameraCenter(
  point: [number, number],
  zoom: number,
  padding: MapPadding,
  bearing = 0,
  inverse = false,
): [number, number] {
  const size = 512 * 2 ** zoom;
  const latitude = (Math.max(-85, Math.min(85, point[1])) * Math.PI) / 180;
  const world = [
    ((point[0] + 180) / 360) * size,
    (0.5 - Math.log((1 + Math.sin(latitude)) / (1 - Math.sin(latitude))) / (4 * Math.PI)) * size,
  ];
  const x = (padding.left - padding.right) / 2;
  const y = (padding.top - padding.bottom) / 2;
  const angle = (bearing * Math.PI) / 180;
  const sign = inverse ? 1 : -1;
  world[0] += sign * (x * Math.cos(angle) - y * Math.sin(angle));
  world[1] += sign * (x * Math.sin(angle) + y * Math.cos(angle));
  return [
    (((((world[0] / size) * 360) % 360) + 360) % 360) - 180,
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * world[1]) / size))) * 180) / Math.PI,
  ];
}
