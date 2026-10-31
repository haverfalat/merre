import {
  OPERATIONS,
  PRODUCTION_ENDPOINTS,
  WEB_API_URL,
  type LegacyOperation,
  type WebOperation,
  type Operation,
} from './constants.js';
import { MavMobileError } from './errors.js';
import type { SessionStore } from './session.js';
import { isRecord } from './validation.js';
import { tokenBase64 } from './tokens.js';
import type { ApiRecord, Fetch, Language, RequestOptions } from './types.js';

export interface TransportOptions {
  fetch?: Fetch;
  timeoutMs?: number;
  language?: Language;
  endpoints?: { public: string; secure: string };
  webBaseUrl?: string;
}

export class Transport {
  private readonly fetch: Fetch;
  private readonly timeoutMs: number;
  private readonly endpoints: { public: string; secure: string };
  private readonly webBaseUrl: string;
  readonly language: Language;
  beforeAuthenticatedRequest?: (options: RequestOptions) => Promise<void>;

  constructor(
    private readonly sessions: SessionStore,
    options: TransportOptions = {},
  ) {
    this.fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = options.timeoutMs ?? 25_000;
    this.language = options.language ?? 'HU';
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0)
      throw new MavMobileError('input', 'Invalid timeout');
    this.endpoints = { ...(options.endpoints ?? PRODUCTION_ENDPOINTS) };
    this.webBaseUrl = options.webBaseUrl ?? WEB_API_URL;
    for (const endpoint of [...Object.values(this.endpoints), this.webBaseUrl]) {
      const url = new URL(endpoint);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
        throw new MavMobileError('input', 'API endpoints must use HTTPS without credentials');
    }
  }

  async request<T extends ApiRecord>(
    operation: LegacyOperation,
    fields: ApiRecord = {},
    options: RequestOptions = {},
    authenticated = false,
  ): Promise<T> {
    if (authenticated && operation !== 'BejelentkezesHosszabbitas')
      await this.beforeAuthenticatedRequest?.(options);
    const profile = authenticated ? this.sessions.require() : null;
    const body = {
      ...fields,
      ...(profile ? { FelhasznaloAzonosito: profile.email, Token: profile.session.token } : {}),
      Nyelv: options.language ?? this.language,
      UAID: profile?.uaid ?? this.sessions.profile?.uaid ?? this.sessions.uaid,
    };
    const base = this.endpoints[OPERATIONS[operation]].replace(/\/*$/, '/');
    return this.post(operation, `${base}${operation}`, body, {}, options);
  }

  async webRequest<T extends ApiRecord>(
    operation: WebOperation,
    fields: ApiRecord,
    options: RequestOptions = {},
  ): Promise<T> {
    await this.beforeAuthenticatedRequest?.(options);
    const profile = this.sessions.require();
    const base = this.webBaseUrl.replace(/\/*$/, '/');
    return this.post(
      operation,
      `${base}api/ProfileApi/${operation}`,
      {
        ...fields,
        userEmail: profile.email,
      },
      {
        Language: options.language ?? this.language,
        UserTokenXml: tokenBase64(profile.session.token),
      },
      options,
    );
  }

  private async post<T extends ApiRecord>(
    operation: Operation,
    url: string,
    body: ApiRecord,
    headers: Record<string, string>,
    options: RequestOptions,
  ): Promise<T> {
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    if (options.signal?.aborted) abort();
    else options.signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(() => {
      timedOut = true;
      abort();
    }, this.timeoutMs);
    try {
      const response = await this.fetch(url, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: controller.signal,
        redirect: 'error',
      });
      if (!response.ok)
        throw new MavMobileError(
          response.status === 401 || response.status === 403 ? 'auth' : 'http',
          `MAV request failed: HTTP ${response.status}`,
          operation,
          response.status,
        );
      const text = await response.text();
      let value: unknown;
      try {
        value = JSON.parse(text);
      } catch {
        throw new MavMobileError(
          'protocol',
          'MAV returned invalid JSON',
          operation,
          response.status,
        );
      }
      if (!isRecord(value))
        throw new MavMobileError(
          'protocol',
          'MAV returned an invalid response',
          operation,
          response.status,
        );
      return value as T;
    } catch (error) {
      if (error instanceof MavMobileError) throw error;
      const code = options.signal?.aborted ? 'aborted' : timedOut ? 'timeout' : 'network';
      throw new MavMobileError(code, `MAV request failed (${code})`, operation);
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', abort);
    }
  }
}
