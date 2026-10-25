import { serviceDayBounds } from './utils/service-time';
import type { ClientCore } from './core';
import {
  vehiclePositionsBBoxQuery,
  VEHICLE_POSITIONS_FOR_TRIPS_QUERY,
  DEFAULT_VEHICLE_MODES,
} from './queries';
import type { VehiclePosition, VehicleBounds, TripKeyInput } from '../types/vehicle';
import type { Mode } from '../types/common';

/** Realtime vehicle tracking. */
export function createVehicleApi(core: ClientCore) {
  /**
   * Live vehicle positions inside a bounding box, filtered by transport mode.
   *
   * @example
   * await futar.vehiclesInBounds({ swLat: 47.3, swLon: 18.9, neLat: 47.7, neLon: 19.4 });
   */
  async function vehiclesInBounds(
    bounds: VehicleBounds,
    modes: Mode[] = DEFAULT_VEHICLE_MODES,
  ): Promise<VehiclePosition[]> {
    const query = vehiclePositionsBBoxQuery({ ...bounds, modes });
    const res = await core.graphql<{ vehiclePositions: VehiclePosition[] }>(query);
    return res.data!.vehiclePositions;
  }

  /**
   * Live positions for a specific list of trips (by gtfs id + service day).
   *
   * @example
   * await futar.vehiclePositionsForTrips([
   *   { id: '1:33736056', serviceDay: '2026-08-10' },
   * ]);
   */
  async function vehiclePositionsForTrips(trips: TripKeyInput[]): Promise<VehiclePosition[]> {
    const normalized = trips.map((t) => ({
      id: t.id,
      serviceDay: typeof t.serviceDay === 'string' ? toEpochMillis(t.serviceDay) : t.serviceDay,
    }));
    const res = await core.graphql<{ vehiclePositionsForTrips: VehiclePosition[] }>(
      VEHICLE_POSITIONS_FOR_TRIPS_QUERY,
      { trips: normalized },
      'GetVehiclePositionsForTrips',
    );
    return res.data!.vehiclePositionsForTrips;
  }

  return { vehiclesInBounds, vehiclePositionsForTrips };
}

/** Convert an ISO date (`YYYY-MM-DD`) to Budapest-midnight epoch millis. */
export function toEpochMillis(isoDate: string): number {
  const normalized = isoDate.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
  const noon = Date.parse(`${normalized}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(normalized) ||
    !Number.isFinite(noon) ||
    new Date(noon).toISOString().slice(0, 10) !== normalized
  ) {
    throw new Error('Invalid service date');
  }
  return serviceDayBounds(noon).start * 1000;
}

export type VehicleApi = ReturnType<typeof createVehicleApi>;
