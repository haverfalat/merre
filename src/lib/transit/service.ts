import {
  configureMavTransport,
  createMavTransitClient,
  MAVPLUSZ_BACKEND_ID,
} from './adapters/mavplusz/client';
import type { TransitClient } from './client';

const backendId = MAVPLUSZ_BACKEND_ID;

export function configureTransit(options: { baseUrl: string }) {
  configureMavTransport(options);
}

export function getTransit(signal: AbortSignal, language: 'en' | 'hu' = 'en'): TransitClient {
  return createMavTransitClient({ signal, language });
}

export function transitQueryKey(operation: string, ...parameters: unknown[]) {
  return [operation, ...parameters, backendId] as const;
}
