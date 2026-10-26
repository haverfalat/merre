import type { QueryClient } from '@tanstack/react-query';
import { backendFor, initializeAccounts, useTicketAccounts } from './accounts.native';
import { providerById } from './providers.native';
import type { AccountSummary, OwnedWalletTicket } from './types';

export function ticketQueryOptions(account: AccountSummary, language: 'hu' | 'en') {
  return {
    queryKey: ['ticket-wallet', account.id, language, account.revision],
    queryFn: () => backendFor(account.id).tickets(language),
    staleTime: 30_000,
    retry: false as const,
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
): Promise<OwnedWalletTicket[]> {
  await initializeAccounts();
  const accounts = useTicketAccounts.getState().accounts;
  const results = await Promise.allSettled(
    accounts.map(async (account) =>
      ownedTickets(account, await cache.fetchQuery(ticketQueryOptions(account, language))),
    ),
  );
  return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
}
