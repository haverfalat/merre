import type { GraphQLError } from '../../types/common';

/** Base error for all mavplusz.js failures. */
export class MavPluszError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** The HTTP request failed or returned a non-2xx status. */
export class MavPluszHttpError extends MavPluszError {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly body: string;

  constructor(url: string, status: number, statusText: string, body: string) {
    super(`MÁV PlusZ request failed with HTTP ${status} ${statusText} (${url})`);
    this.name = 'MavPluszHttpError';
    this.url = url;
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

/** The server answered with GraphQL errors (malformed query, bad input, ...). */
export class MavPluszGraphQLError extends MavPluszError {
  readonly errors: GraphQLError[];

  constructor(errors: GraphQLError[]) {
    super(
      errors.map((e) => `${e.message}${e.path ? ` @ ${e.path.join('.')}` : ''}`).join('; ') ||
        'Unknown GraphQL error',
    );
    this.name = 'MavPluszGraphQLError';
    this.errors = errors;
  }
}

/** The request exceeded the configured timeout. */
export class MavPluszTimeoutError extends MavPluszError {
  constructor(ms: number) {
    super(`MÁV PlusZ request timed out after ${ms} ms`);
    this.name = 'MavPluszTimeoutError';
  }
}
