export const QUERY_STALE = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 30000,
  SEARCH: 60000,
  INFINITY: Infinity,
} as const;

export const QUERY_REFETCH = { LIVE: 5000 } as const;
