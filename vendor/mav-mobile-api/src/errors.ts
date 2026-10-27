import type { Operation } from './constants.js';
import type { ApiMessage } from './types.js';

export type ErrorCode =
  | 'input'
  | 'auth'
  | 'expired-session'
  | 'network'
  | 'timeout'
  | 'aborted'
  | 'http'
  | 'api'
  | 'protocol'
  | 'busy'
  | 'unavailable';

export class MavMobileError extends Error {
  readonly name = 'MavMobileError';

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly operation?: Operation,
    readonly status?: number,
    readonly messages: readonly ApiMessage[] = [],
  ) {
    super(message);
  }
}
