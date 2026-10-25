import type { PlaceInput } from '../../types/plan';

/**
 * Format a place into the OTP `fromPlace` / `toPlace` string.
 *
 * OTP v2 accepts either `lat,lon` coordinates or `Name::gtfsId` stop
 * references. When an object has both a gtfsId and coordinates the gtfsId
 * wins (matching what the MÁV PlusZ web client sends).
 */
export function toOtpPlace(place: PlaceInput): string {
  if (typeof place === 'string') return place;

  const { name, gtfsId, lat, lon } = place;

  if (gtfsId) {
    return `${name ?? ''}::${gtfsId}`;
  }

  if (typeof lat === 'number' && typeof lon === 'number') {
    return `${lat},${lon}`;
  }

  throw new Error(
    'Invalid place: provide either a string, a `{ gtfsId }` reference or `{ lat, lon }` coordinates.',
  );
}
