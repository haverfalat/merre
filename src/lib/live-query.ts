import { LIVE_REFETCH_INTERVAL } from '@/lib/transit/query-policy';

/** Poll visible live views, and catch up when the user returns to the app. */
export const LIVE_QUERY_OPTIONS = {
  staleTime: LIVE_REFETCH_INTERVAL,
  refetchInterval: LIVE_REFETCH_INTERVAL,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
} as const;
