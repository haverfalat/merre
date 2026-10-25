export type TransitErrorKind = 'request' | 'unavailable' | 'timeout' | 'network';

export class TransitError extends Error {
  constructor(
    message: string,
    readonly kind: TransitErrorKind,
    readonly retryable: boolean,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'TransitError';
  }
}
