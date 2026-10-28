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
  const uniqueAlerts = new Map(
    (alerts ?? []).map((alert) => [alert.id || alert.alertHash || JSON.stringify(alert), alert]),
  );
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
      {[...uniqueAlerts].map(([key, alert]) => (
        <AlertCard key={key} alert={alert} />
      ))}
    </>
  );
}
