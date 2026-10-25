import { QUERY_REFETCH } from '@/lib/transit/query-policy';

/** Poll visible live views, and catch up when the user returns to the app. */
export const LIVE_QUERY_OPTIONS = {
  staleTime: QUERY_REFETCH.LIVE,
  refetchInterval: QUERY_REFETCH.LIVE,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const;
