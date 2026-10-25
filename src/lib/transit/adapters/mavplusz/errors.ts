import {
  MavPluszGraphQLError,
  MavPluszHttpError,
  MavPluszTimeoutError,
} from '../../../mavplusz/src/utils/errors';
import { TransitError } from '../../errors';

export async function transitResponse<T>(
  signal: AbortSignal,
  request: () => Promise<T>,
): Promise<T> {
  try {
    signal.throwIfAborted();
    return await request();
  } catch (error) {
    if (signal.aborted) throw signal.reason ?? error;
    if (error instanceof Error && error.name === 'AbortError') throw error;
    if (error instanceof MavPluszGraphQLError)
      throw new TransitError(error.message, 'request', false, { cause: error });
    if (error instanceof MavPluszHttpError) {
      throw new TransitError(
        error.message,
        'unavailable',
        error.status >= 500 || error.status === 429,
        { cause: error },
      );
    }
    if (error instanceof MavPluszTimeoutError)
      throw new TransitError(error.message, 'timeout', true, { cause: error });
    throw new TransitError(
      error instanceof Error ? error.message : 'Transit request failed',
      'network',
      true,
      { cause: error },
    );
  }
}
