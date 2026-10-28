import type { Alert } from '@/lib/transit/types/alerts';
import { QueryError } from './QueryError';
import { AlertCard } from './transit/AlertCard';

export interface QueryState {
  data: unknown;
  isError: boolean;
  isFetching: boolean;
  refetch: () => unknown;
}

export function QueryNotice({ query, alerts }: { query: QueryState; alerts?: Alert[] | null }) {
  return (
    <>
      {query.isError && (
        <QueryError
          retry={() => {
            void query.refetch();
          }}
          stale={!!query.data}
        />
      )}
      {alerts?.map((alert, index) => (
        <AlertCard key={alert.id || index} alert={alert} />
      ))}
    </>
  );
}
