import type { ClientCore } from './core';
import { TRIP_QUERY } from './queries';
import { indexPathFor } from './config';
import { decodePolyline, type LatLng } from './utils/polyline';
import type { TripDetail } from '../types/trip';
import type { ISODate } from '../types/common';

interface TripGeometryEnvelope {
  points?: string;
  length?: number;
}

/** Trip detail: full stop times, on-board services, coupled coaches, live vehicle. */
export function createTripApi(core: ClientCore) {
  /**
   * Full detail of a specific train/coach run (all stop times, alerts,
   * on-board info services, through coaches and live vehicle positions).
   *
   * @example
   * await futar.trip('1:33736056', '2026-08-10');
   */
  async function trip(
    id: string,
    serviceDay?: ISODate,
    language = core.language,
  ): Promise<TripDetail> {
    const variables: Record<string, unknown> = {
      id,
      serviceDay: serviceDay ?? null,
      language,
    };
    const res = await core.graphql<{ trip: TripDetail }>(TRIP_QUERY, variables, 'Trip');
    return res.data!.trip;
  }

  /** Decoded polyline shape of a trip (fetched from the OTP index REST API). */
  async function tripGeometry(id: string): Promise<{ points: string; coordinates: LatLng[] }> {
    const envelope = await core.transport.getJson<TripGeometryEnvelope>(
      `${indexPathFor(core.config.router)}/trips/${encodeURIComponent(id)}/geometry`,
    );
    const points = envelope.points ?? '';
    return { points, coordinates: decodePolyline(points) };
  }

  return { trip, tripGeometry };
}

export type TripApi = ReturnType<typeof createTripApi>;
