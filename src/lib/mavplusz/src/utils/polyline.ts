export interface LatLng {
  lat: number;
  lon: number;
}

/**
 * Decode a Google encoded polyline string into lat/lon coordinates.
 *
 * Uses the standard algorithm: each value is encoded as ASCII - 63,
 * with 5-bit chunks and continuation bits.
 *
 * @param points - Encoded polyline string (standard Google polyline encoding).
 */
export function decodePolyline(points: string): LatLng[] {
  const out: LatLng[] = [];
  const len = points.length;
  let index = 0;
  let lat = 0;
  let lon = 0;

  function readValue(): number {
    let result = 0;
    let shift = 0;
    let chunk: number;
    do {
      if (index >= len || shift > 30) throw new Error('Invalid encoded polyline');
      chunk = points.charCodeAt(index++) - 63;
      if (chunk < 0 || chunk > 63) throw new Error('Invalid encoded polyline');
      result |= (chunk & 0x1f) << shift;
      shift += 5;
    } while (chunk >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  }
  while (index < len) {
    lat += readValue();
    lon += readValue();
    if (Math.abs(lat / 1e5) > 90 || Math.abs(lon / 1e5) > 180)
      throw new Error('Invalid polyline coordinates');
    out.push({ lat: lat / 1e5, lon: lon / 1e5 });
  }

  return out;
}

/**
 * Encode a list of lat/lon coordinates into a Google encoded polyline string.
 */
export function encodePolyline(coords: LatLng[]): string {
  let out = '';
  let prevLat = 0;
  let prevLon = 0;

  for (const { lat, lon } of coords) {
    const dlat = Math.round(lat * 1e5) - prevLat;
    const dlon = Math.round(lon * 1e5) - prevLon;
    prevLat += dlat;
    prevLon += dlon;
    out += encodeValue(dlat);
    out += encodeValue(dlon);
  }

  return out;
}

function encodeValue(value: number): string {
  let out = '';
  let v = value < 0 ? ~(value << 1) : value << 1;
  while (v >= 0x20) {
    out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  out += String.fromCharCode(v + 63);
  return out;
}
