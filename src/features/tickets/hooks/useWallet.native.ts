import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import { initializeAccounts, useTicketAccounts } from '~/lib/tickets/accounts.native';
import { ownedTickets, ticketQueryOptions } from '~/lib/tickets/queries.native';

export function useWallet() {
  const state = useTicketAccounts();
  const { language } = useTranslation();
  useEffect(() => {
    void initializeAccounts().catch(() => {});
  }, []);
  const queries = useQueries({
    queries: state.accounts.map((account) => ({
      ...ticketQueryOptions(account, language),
      enabled: state.ready,
    })),
  });
  const tickets = queries.flatMap((query, index) =>
    ownedTickets(state.accounts[index], query.data ?? []),
  );
  const failures = queries.flatMap((query, index) =>
    query.error ? [{ account: state.accounts[index], error: query.error }] : [],
  );
  return {
    ...state,
    language,
    tickets,
    failures,
    isPending: queries.some((query) => query.isPending),
    isFetching: queries.some((query) => query.isFetching),
    refetch: () => Promise.allSettled(queries.map((query) => query.refetch())),
  };
}
