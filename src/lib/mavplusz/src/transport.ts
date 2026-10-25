import type { GraphQLResponse, GraphQLError } from '../types/common';
import { MavPluszError, MavPluszHttpError, MavPluszTimeoutError } from './utils/errors';

export interface TransportConfig {
  baseUrl: string;
  graphqlPath: string;
  timeout?: number;
  headers?: Record<string, string>;
  fetch?: typeof globalThis.fetch;
}
export interface GraphQLPayload {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string | null;
}

export class HttpTransport {
  readonly baseUrl: string;
  readonly graphqlPath: string;
  private readonly timeout: number;
  private readonly headers: Record<string, string>;
  private readonly customFetch?: typeof globalThis.fetch;

  constructor(config: TransportConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.graphqlPath = config.graphqlPath.replace(/^\/+/, '');
    this.timeout = config.timeout ?? 20_000;
    this.headers = config.headers ?? {};
    this.customFetch = config.fetch;
  }

  private getEffectiveBaseUrl(): string {
    if (this.baseUrl.startsWith('/')) {
      return typeof window === 'undefined'
        ? 'https://mavplusz.hu'
        : `${window.location.origin}${this.baseUrl}`;
    }
    return this.baseUrl;
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await (this.customFetch ?? globalThis.fetch)(url, {
        ...init,
        signal: controller.signal,
      });
      const text = await response.text();
      if (!response.ok)
        throw new MavPluszHttpError(url, response.status, response.statusText, text);
      if (!text) throw new MavPluszError(`Empty response from ${url}`);
      try {
        return JSON.parse(text) as T;
      } catch (cause) {
        throw new MavPluszError(`Invalid JSON from ${url}`, { cause });
      }
    } catch (error) {
      if (controller.signal.aborted) throw new MavPluszTimeoutError(this.timeout);
      if (error instanceof MavPluszError || (error instanceof Error && error.name === 'AbortError'))
        throw error;
      throw new MavPluszError(`Network request to ${url} failed`, { cause: error });
    } finally {
      clearTimeout(timer);
    }
  }

  async requestGraphQL<TData>(payload: GraphQLPayload): Promise<GraphQLResponse<TData>> {
    return this.request(`${this.getEffectiveBaseUrl()}/${this.graphqlPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...this.headers },
      body: JSON.stringify({
        query: payload.query,
        variables: payload.variables ?? {},
        operationName: payload.operationName ?? null,
      }),
    });
  }

  async getJson<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${this.getEffectiveBaseUrl()}/${path.replace(/^\/+/, '')}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    return this.request<T>(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json', ...this.headers },
    });
  }
}

export type { GraphQLError };
