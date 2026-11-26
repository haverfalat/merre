import type { VehiclePosition } from './transit/types/vehicle';
import type { SelectedVehicle } from '@/store/useMapStore';

export const vehiclePositionKey = (position: VehiclePosition) =>
  position.vehicleId ||
  `${position.trip?.gtfsId || position.trip?.id}|${position.trip?.serviceDate?.replaceAll('-', '') ?? ''}`;

/** A vehicle can occur in multiple feeds; keep its newest fix and known metadata. */
export function uniqueVehiclePositions(positions: VehiclePosition[]) {
  const unique = new Map<string, VehiclePosition>();
  for (const position of positions) {
    const key = vehiclePositionKey(position);
    const previous = unique.get(key);
    if (!previous || (position.lastUpdated ?? 0) >= (previous.lastUpdated ?? 0))
      unique.set(key, previous ? newestVehiclePosition([position, previous])! : position);
    else unique.set(key, newestVehiclePosition([previous, position])!);
  }
  return [...unique.values()];
}

export function matchesSelectedVehicle(position: VehiclePosition, selection: SelectedVehicle) {
  if (selection.vehicleId && position.vehicleId && selection.vehicleId !== position.vehicleId)
    return false;
  const tripId = position.trip?.gtfsId || position.trip?.id;
  const date = position.trip?.serviceDate;
  return (
    (tripId === selection.tripId ||
      (!!selection.vehicleId && position.vehicleId === selection.vehicleId)) &&
    (!selection.serviceDay || !date ||
      selection.serviceDay.replaceAll('-', '') === date.replaceAll('-', ''))
  );
}

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
  const prevOrCurrentStop = position.prevOrCurrentStop ?? previous.prevOrCurrentStop;
  const nextStop = position.nextStop ?? previous.nextStop;
  if (
    vehicleModel === position.vehicleModel &&
    licensePlate === position.licensePlate &&
    uicCode === position.uicCode &&
    prevOrCurrentStop === position.prevOrCurrentStop &&
    nextStop === position.nextStop
  )
    return position;
  return { ...position, vehicleModel, licensePlate, uicCode, prevOrCurrentStop, nextStop };
}
export function retainVehicleListMetadata(
  incoming: VehiclePosition[],
  previous: VehiclePosition[],
): VehiclePosition[] {
  const byId = new Map<string, VehiclePosition>();
  const withoutId: VehiclePosition[] = [];
  for (const position of previous) {
    if (position.vehicleId) {
      if (!byId.has(position.vehicleId)) byId.set(position.vehicleId, position);
    } else withoutId.push(position);
  }
  return incoming.map((position) =>
    retainVehicleMetadata(
      position,
      position.vehicleId
        ? byId.get(position.vehicleId) ?? withoutId.find((candidate) => sameVehicle(position, candidate))
        : previous.find((candidate) => sameVehicle(position, candidate)),
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
