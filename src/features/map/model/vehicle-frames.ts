import type { VehiclePosition } from '@/lib/transit/types/vehicle';
import { vehicleMotionKey } from '@/lib/vehicle-motion';

export function visibleVehicleFrames(
  current: VehiclePosition[],
  animated: VehiclePosition[] | undefined,
) {
  const frames = new Map(
    (animated ?? []).map((position) => [vehicleMotionKey(position), position]),
  );
  return current.map((position) => {
    const frame = frames.get(vehicleMotionKey(position));
    return frame
      ? { ...position, lon: frame.lon, lat: frame.lat, heading: frame.heading }
      : position;
  });
}
