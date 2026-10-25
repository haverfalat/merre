import type { Language } from '../types/common';

export interface MavPluszOptions {
  /**
   * API key. Accepted for parity with other FUTÁR-style wrappers.
   * The public mavplusz.hu deployment does NOT require authentication
   * (`/otp2-backend/otp/auth/get-jwt` answers "The authentication is disabled."),
   * so this is optional and only adds an `Authorization: Bearer` header.
   */
  apiKey?: string;
  /** API dialect. Defaults to `otp` (OpenTripPlanner). */
  dialect?: string;
  /** OTP version. Defaults to `2`. */
  version?: string;
  /** Base URL of the MÁV PlusZ web app. */
  baseUrl?: string;
  /** OTP router id. Defaults to `default`. */
  router?: string;
  /** Language used for localized texts. Defaults to `en-US`. */
  language?: Language;
  /** Booking channel, passed to the `plan` query. */
  distributionChannel?: string;
  /** Booking sub channel, passed to the `plan` query. */
  distributionSubChannel?: string;
  /** Request timeout in milliseconds. Defaults to 20 000. */
  timeout?: number;
  /** Custom fetch implementation (Node 18+, or an injectable one). */
  fetch?: typeof globalThis.fetch;
  /** Extra HTTP headers added to every request. */
  headers?: Record<string, string>;
}

export interface ResolvedConfig {
  apiKey?: string;
  dialect: string;
  version: string;
  baseUrl: string;
  router: string;
  language: Language;
  distributionChannel: string;
  distributionSubChannel: string;
  timeout: number;
  headers: Record<string, string>;
}

export const DEFAULT_BASE_URL = '/api/mav/proxy';
export const DEFAULT_ROUTER = 'default';
export const DEFAULT_LANGUAGE = 'en-US';
export const DEFAULT_DISTRIBUTION_CHANNEL = 'ERTEKESITESI_CSATORNA#INTERNET';
export const DEFAULT_DISTRIBUTION_SUB_CHANNEL = 'ERTEKESITESI_ALCSATORNA#EMMA';

export function resolveConfig(options: MavPluszOptions = {}): ResolvedConfig {
  return {
    apiKey: options.apiKey,
    dialect: options.dialect ?? 'otp',
    version: options.version ?? '2',
    baseUrl: (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ''),
    router: options.router ?? DEFAULT_ROUTER,
    language: options.language ?? DEFAULT_LANGUAGE,
    distributionChannel: options.distributionChannel ?? DEFAULT_DISTRIBUTION_CHANNEL,
    distributionSubChannel: options.distributionSubChannel ?? DEFAULT_DISTRIBUTION_SUB_CHANNEL,
    timeout: options.timeout ?? 20000,
    headers: options.headers ?? {},
  };
}

/** The OTP GraphQL endpoint path for the configured router. */
export function graphqlPathFor(router: string): string {
  return `/otp2-backend/otp/routers/${router}/index/graphql`;
}

/** The OTP REST "index" base path (trip geometry, etc.). */
export function indexPathFor(router: string): string {
  return `/otp2-backend/otp/routers/${router}/index`;
}
