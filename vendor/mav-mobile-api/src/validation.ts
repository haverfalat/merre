import { MavMobileError } from './errors.js';
import type { Operation } from './constants.js';
import type { ApiMessage, ApiRecord } from './types.js';

export function isRecord(value: unknown): value is ApiRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new MavMobileError('input', `${field} is required`);
  return value;
}

export function epochMillis(value: unknown): number | null {
  if (typeof value === 'number') {
    const result = value * 1000;
    return Number.isFinite(result) && Math.abs(result) <= 8.64e15 ? result : null;
  }
  if (typeof value !== 'string' || !value.trim()) return null;
  const microsoft = /^\/Date\((-?\d+)(?:[+-]\d{4})?\)\/$/.exec(value);
  if (microsoft) return epochMillis(Number(microsoft[1]) / 1000);
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return epochMillis(Number(value));
  const result = Date.parse(value);
  return Number.isFinite(result) ? result : null;
}

export function requireField(
  response: ApiRecord,
  field: string,
  operation: Operation,
  array: boolean,
): void {
  const valid = array
    ? Array.isArray(response[field]) && response[field].every(isRecord)
    : isRecord(response[field]);
  if (valid) return;
  throw responseError(response, field, operation);
}

export function requireAnyField(response: ApiRecord, fields: string[], operation: Operation): void {
  if (fields.some((field) => response[field] !== undefined)) return;
  throw responseError(response, fields.join('/'), operation);
}

function responseError(response: ApiRecord, field: string, operation: Operation): MavMobileError {
  const messages = Array.isArray(response.Uzenetek)
    ? (response.Uzenetek.filter(isRecord) as ApiMessage[])
    : [];
  return new MavMobileError(
    messages.length ? 'api' : 'protocol',
    `MAV did not return ${field}`,
    operation,
    undefined,
    messages,
  );
}
