import { fromByteArray, toByteArray } from 'base64-js';
import { TicketWalletError } from './errors';

export function encodeUtf8(value: string): Uint8Array {
  const encoded = encodeURIComponent(value);
  const bytes: number[] = [];
  for (let index = 0; index < encoded.length; index++) {
    if (encoded[index] === '%') {
      bytes.push(parseInt(encoded.slice(index + 1, index + 3), 16));
      index += 2;
    } else bytes.push(encoded.charCodeAt(index));
  }
  return new Uint8Array(bytes);
}
export function decodeUtf8(value: Uint8Array): string {
  return decodeURIComponent(
    Array.from(value, (byte) => `%${byte.toString(16).padStart(2, '0')}`).join(''),
  );
}
export const base64 = (bytes: Uint8Array) => fromByteArray(bytes);
export function decodeBase64(value: string): Uint8Array {
  const normal = value.replaceAll('-', '+').replaceAll('_', '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normal) || normal.length % 4 === 1)
    throw new TicketWalletError('protocol');
  return toByteArray(normal.padEnd(Math.ceil(normal.length / 4) * 4, '='));
}
