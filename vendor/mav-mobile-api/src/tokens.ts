import { fromByteArray, toByteArray } from 'base64-js';
import { MavMobileError } from './errors.js';
import { epochMillis, requiredString } from './validation.js';

export function tokenXml(value: string): string {
  requiredString(value, 'token');
  if (value.length > 750_000) throw new MavMobileError('input', 'MAV token is too large');
  if (value.trim().startsWith('<')) return value;
  try {
    const encoded = value.replace(/\s/g, '');
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error();
    const bytes = toByteArray(encoded);
    const xml = decodeURIComponent(
      Array.from(bytes, (byte) => `%${byte.toString(16).padStart(2, '0')}`).join(''),
    );
    if (!xml.trim().startsWith('<')) throw new Error();
    return xml;
  } catch {
    throw new MavMobileError(
      'input',
      'MAV session must contain an XML token or its Base64 encoding',
    );
  }
}

export function tokenExpiresAt(xml: string): number | null {
  const conditions = /<(?:[\w-]+:)?Conditions\b([^>]*)>/.exec(xml)?.[1];
  if (!conditions) return null;
  const expiry = /\bNotOnOrAfter\s*=\s*(["'])(.*?)\1/.exec(conditions)?.[2];
  return expiry ? epochMillis(expiry) : null;
}

export function tokenBase64(xml: string): string {
  const encoded = encodeURIComponent(xml);
  const bytes: number[] = [];
  for (let index = 0; index < encoded.length; index++) {
    if (encoded[index] === '%') {
      bytes.push(parseInt(encoded.slice(index + 1, index + 3), 16));
      index += 2;
    } else bytes.push(encoded.charCodeAt(index));
  }
  return fromByteArray(new Uint8Array(bytes));
}
