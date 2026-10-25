import type { GraphQLResponse } from '../types/common';
import type { HttpTransport } from './transport';
import type { ResolvedConfig } from './config';

/**
 * The subset of the client that the feature modules depend on. Defined here
 * (instead of importing `MavPluszClient`) to avoid circular imports.
 */
export interface ClientCore {
  readonly transport: HttpTransport;
  readonly config: ResolvedConfig;
  readonly language: string;
  /** Execute a GraphQL query and return the full response envelope. */
  graphql<TData>(
    query: string,
    variables?: Record<string, unknown>,
    operationName?: string | null,
  ): Promise<GraphQLResponse<TData>>;
}
