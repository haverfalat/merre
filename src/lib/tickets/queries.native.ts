import type { QueryClient, QueryFunctionContext } from '@tanstack/react-query';
import { MavMobileError } from 'mav-mobile-api';
import { backendFor, initializeAccounts, useTicketAccounts } from './accounts.native';
import { providerById } from './providers.native';
import type { AccountSummary, OwnedWalletTicket, WalletTicket } from './types';

export function ticketQueryOptions(account: AccountSummary, language: 'hu' | 'en') {
  return {
    queryKey: ['ticket-wallet', account.id, language, account.revision],
    queryFn: ({ client, queryKey, signal }: QueryFunctionContext) =>
      backendFor(account.id).tickets(language, (tickets) => {
        // Do not resurrect removed accounts or publish an older, cancelled refresh.
        if (!signal.aborted && useTicketAccounts.getState().accounts.some(
          (current) => current.id === account.id && current.revision === account.revision,
        )) client.setQueryData<WalletTicket[]>(queryKey, (previous) => tickets.map(ticket => {
          const saved = previous?.find(item => item.id === ticket.id);
          // A metadata-only update must not flash "not downloaded" for a saved pass.
          return saved?.offlineAvailable && saved.validTo === ticket.validTo &&
            saved.validFrom === ticket.validFrom && ticket.canInspect &&
            ['VALID', 'FUTURE_VALID'].includes(ticket.status)
            ? { ...ticket, offlineAvailable: true } : ticket;
        }));
      }),
    networkMode: (account.providerId === 'mav' ? 'always' : 'online') as 'always' | 'online',
    staleTime: 30_000,
    refetchOnMount: 'always' as const,
    refetchOnWindowFocus: 'always' as const,
    refetchOnReconnect: 'always' as const,
    retry: (failureCount: number, error: Error) => account.providerId === 'mav' &&
      failureCount < 2 && error instanceof MavMobileError &&
      (['network', 'timeout', 'temporarily-unavailable'].includes(error.code) ||
        (error.code === 'http' && (error.status ?? 0) >= 500)),
    retryDelay: (attempt: number, error: Error) =>
      error instanceof MavMobileError && error.code === 'temporarily-unavailable'
        ? 31_000 : Math.min(1000 * 2 ** attempt, 30_000),
  };
}
export function ownedTickets(
  account: AccountSummary,
  tickets: Awaited<ReturnType<ReturnType<typeof backendFor>['tickets']>>,
): OwnedWalletTicket[] {
  return tickets.map((ticket) => ({
    ...ticket,
    accountId: account.id,
    accountLabel: account.label,
    providerId: account.providerId,
    providerName: providerById(account.providerId).name,
  }));
}
export async function loadWalletTickets(
  cache: QueryClient,
  language: 'hu' | 'en',
  filter?: { providerIds?: string[]; capability?: 'boarding' | 'scan' },
): Promise<OwnedWalletTicket[]> {
  await initializeAccounts();
  const accounts = useTicketAccounts.getState().accounts.filter((account) =>
    (!filter?.providerIds || filter.providerIds.includes(account.providerId)) &&
    (!filter?.capability || providerById(account.providerId).capabilities.includes(filter.capability)),
  );
  const results = await Promise.allSettled(
    accounts.map(async (account) =>
      ownedTickets(account, await cache.fetchQuery(ticketQueryOptions(account, language))),
    ),
  );
  return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}
