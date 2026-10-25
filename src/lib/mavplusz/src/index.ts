import { MavPluszClient } from './client';
import type { MavPluszOptions } from './config';
import {
  MavPluszError,
  MavPluszHttpError,
  MavPluszGraphQLError,
  MavPluszTimeoutError,
} from './utils/errors';
import { decodePolyline, encodePolyline, type LatLng } from './utils/polyline';
import { toOtpPlace } from './utils/place';
import { toEpochMillis } from './vehicles';

export type * from '../types/index';

export {
  MavPluszClient,
  MavPluszError,
  MavPluszHttpError,
  MavPluszGraphQLError,
  MavPluszTimeoutError,
};
export { decodePolyline, encodePolyline, toOtpPlace, toEpochMillis };
export type { LatLng, MavPluszOptions };

/** Default distribution channel for the public web shop. */
export const DEFAULT_DISTRIBUTION_CHANNEL = 'ERTEKESITESI_CSATORNA#INTERNET';
/** Default distribution sub channel for the public web shop. */
export const DEFAULT_DISTRIBUTION_SUB_CHANNEL = 'ERTEKESITESI_ALCSATORNA#EMMA';

/**
 * Create a MÁV PlusZ API client.
 *
 * @example
 * ```ts
 * import { createMavPlusz } from 'mavplusz.js';
 *
 * const futar = createMavPlusz({
 *   apiKey: 'your-api-key-here', // optional; the public API needs no auth
 *   dialect: 'otp',
 *   version: '2',
 *   language: 'hu',
 * });
 *
 * const plan = await futar.plan({
 *   from: { name: 'Budapest-Keleti', gtfsId: '1:005510017_0' },
 *   to: { name: 'Vác', gtfsId: '1:005510447_0' },
 * });
 * ```
 */
export function createMavPlusz(options: MavPluszOptions = {}): MavPluszClient {
  return new MavPluszClient(options);
}
