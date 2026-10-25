import type { VehiclePosition } from './transit/types/vehicle';

/** Position feeds can arrive in a different order; prefer the newest GPS fix. */
export function newestVehiclePosition(positions: (VehiclePosition | null | undefined)[]) {
  return positions.reduce<VehiclePosition | null>((latest, position) => {
    if (!position) return latest;
    const timestamp = (value: VehiclePosition) =>
      Number.isFinite(value.lastUpdated) ? value.lastUpdated! : -Infinity;
    return !latest || timestamp(position) > timestamp(latest) ? position : latest;
  }, null);
}
