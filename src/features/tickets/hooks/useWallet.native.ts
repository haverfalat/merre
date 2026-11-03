import { useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import { initializeAccounts, useTicketAccounts } from '~/lib/tickets/accounts.native';
import { ownedTickets, ticketQueryOptions } from '~/lib/tickets/queries.native';
import { providerById } from '~/lib/tickets/providers.native';
import type { TicketProvider } from '~/lib/tickets/types';
import { useWalletFocusRefresh } from './useWalletFocusRefresh.native';

export function useWallet(capability?: TicketProvider['capabilities'][number]) {
  const state = useTicketAccounts();
  const { language } = useTranslation();
  useEffect(() => {
    void initializeAccounts().catch(() => {});
  }, []);
  const accounts = capability
    ? state.accounts.filter((account) => providerById(account.providerId).capabilities.includes(capability))
    : state.accounts;
  const queries = useQueries({
    queries: accounts.map((account) => ({
      ...ticketQueryOptions(account, language),
      enabled: state.ready,
    })),
  });
  useWalletFocusRefresh();
  const tickets = queries.flatMap((query, index) =>
    ownedTickets(accounts[index], query.data ?? []),
  );
  const failures = queries.flatMap((query, index) =>
    query.error ? [{ account: accounts[index], error: query.error }] : [],
  );
  return {
    ...state,
    accounts,
    language,
    tickets,
    failures,
    isPending: queries.some((query) => query.isPending),
    isFetching: queries.some((query) => query.isFetching),
    refetch: () => Promise.allSettled(queries.map((query) => query.refetch())),
  };
}
