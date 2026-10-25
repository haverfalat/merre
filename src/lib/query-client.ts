import { QueryClient } from '@tanstack/react-query';
import { TransitError } from './transit/errors';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        gcTime: 300_000,
        refetchOnWindowFocus: false,
        retry: (failures, error) => {
          if (error instanceof TransitError && !error.retryable) return false;
          return failures < 1;
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
