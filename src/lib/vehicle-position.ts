import type { VehiclePosition } from './transit/types/vehicle';

export function sameVehicle(left: VehiclePosition, right: VehiclePosition): boolean {
  if (left.vehicleId && right.vehicleId) return left.vehicleId === right.vehicleId;
  if (left.licensePlate && right.licensePlate) return left.licensePlate === right.licensePlate;
  if (left.uicCode && right.uicCode) return left.uicCode === right.uicCode;
  return false;
}
export function retainVehicleMetadata(
  position: VehiclePosition,
  previous: VehiclePosition | undefined,
): VehiclePosition {
  if (!previous || !sameVehicle(position, previous)) return position;
  const vehicleModel = position.vehicleModel || previous.vehicleModel;
  const licensePlate = position.licensePlate || previous.licensePlate;
  const uicCode = position.uicCode || previous.uicCode;
  if (
    vehicleModel === position.vehicleModel &&
    licensePlate === position.licensePlate &&
    uicCode === position.uicCode
  )
    return position;
  return { ...position, vehicleModel, licensePlate, uicCode };
}
export function retainVehicleListMetadata(
  incoming: VehiclePosition[],
  previous: VehiclePosition[],
): VehiclePosition[] {
  return incoming.map((position) =>
    retainVehicleMetadata(
      position,
      previous.find((candidate) => sameVehicle(position, candidate)),
    ),
  );
}
export function newestVehiclePosition(
  positions: (VehiclePosition | null | undefined)[],
): VehiclePosition | null {
  const candidates = positions.filter((position): position is VehiclePosition => !!position);
  const latest = candidates.reduce<VehiclePosition | null>(
    (latest, position) =>
      !latest || (position.lastUpdated ?? -Infinity) > (latest.lastUpdated ?? -Infinity)
        ? position
        : latest,
    null,
  );
  if (!latest) return null;
  const enriched = candidates.reduce(
    (value, candidate) => retainVehicleMetadata(value, candidate),
    latest,
  );
  if (enriched.speed != null) return enriched;
  const speed = candidates.find(
    (candidate) =>
      sameVehicle(enriched, candidate) &&
      candidate.speed != null &&
      Number.isFinite(candidate.speed) &&
      enriched.lastUpdated != null &&
      candidate.lastUpdated != null &&
      Math.abs(enriched.lastUpdated - candidate.lastUpdated) <= 15,
  )?.speed;
  return speed != null ? { ...enriched, speed } : enriched;
}
