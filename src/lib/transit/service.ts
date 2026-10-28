import { configureBkkTransport } from './adapters/bkk/client';
import { withBkk } from './adapters/bkk/composite';
import {
  configureMavTransport,
  createMavTransitClient,
  MAVPLUSZ_BACKEND_ID,
} from './adapters/mavplusz/client';
import type { TransitClient } from './client';

const backendId = `${MAVPLUSZ_BACKEND_ID}+bkk-v3`;

export function configureTransit(options: { baseUrl: string; bkk?: { apiKey?: string; baseUrl: string } }) {
  configureMavTransport(options);
  if (options.bkk) configureBkkTransport(options.bkk);
}

export function getTransit(signal: AbortSignal, language: 'en' | 'hu' = 'en'): TransitClient {
  return withBkk(createMavTransitClient({ signal, language }), { signal, language });
}

export function transitQueryKey(operation: string, ...parameters: unknown[]) {
  return [operation, ...parameters, backendId] as const;
}
