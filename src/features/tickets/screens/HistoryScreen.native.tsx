import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Empty } from '~/components/ui/Empty';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { initializeAccounts, useTicketAccounts } from '~/lib/tickets/accounts.native';
import { ownedTickets, ticketQueryOptions } from '~/lib/tickets/queries.native';
import { isWalletTicketAvailable } from '~/lib/tickets/eligibility';
import { useTicketTransfer } from '../hooks/useTicketTransfer.native';
import { useTicketInspection } from '../hooks/useTicketInspection.native';
import { TicketCard } from '../components/TicketCard';
import { TicketGroups } from '../components/TicketGroups';
import {
  WalletContent,
  WalletError,
  WalletLoading,
  WalletScreen,
} from '../components/WalletScreen';

export default function HistoryScreen() {
  const { account: accountId } = useLocalSearchParams<{ account: string }>();
  const { ready, accounts } = useTicketAccounts();
  const { t, language } = useTranslation();
  const transfers = useTicketTransfer();
  const inspection = useTicketInspection();
  const [error, setError] = useState<unknown>(null);
  const account = accounts.find((account) => account.id === accountId);
  useEffect(() => {
    void initializeAccounts().catch(setError);
  }, []);
  const query = useQuery(
    account
      ? { ...ticketQueryOptions(account, language), enabled: ready }
      : { queryKey: ['ticket-history-empty'], queryFn: () => Promise.resolve([]), enabled: false },
  );
  const tickets = account
    ? ownedTickets(account, query.data ?? []).filter((ticket) => !isWalletTicketAvailable(ticket))
    : [];
  const retry = () => {
    setError(null);
    void initializeAccounts().then(() => {
      if (account) return query.refetch();
    }).catch(setError);
  };
  return (
    <WalletScreen title={t('tickets_inactive_tickets')}>
      <WalletContent refreshing={query.isFetching && !!query.data}>
        {account && <Text style={{ fontSize: 14 }}>{account.label}</Text>}
        {!error && (!ready || (account && (query.isPending || (query.isFetching && !tickets.length)))) && <WalletLoading variant="tickets" />}
        {error || query.error || inspection.error ? (
          <WalletError
            error={error ?? query.error ?? inspection.error}
            retry={retry}
          />
        ) : null}
        {ready && !error && !query.error && !query.isFetching && (!account || !query.isPending) && !tickets.length && (
          <Empty message={t('tickets_no_inactive_tickets')} />
        )}
        {transfers.error ? <WalletError error={transfers.error} /> : null}
        <TicketGroups tickets={tickets}>
          {(ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              busy={inspection.busy}
              loading={inspection.loading === `${ticket.accountId}:${ticket.id}`}
              onInspect={() => void inspection.inspect(ticket)}
              onTransfer={() => transfers.transfer(ticket)}
              transferring={transfers.loading === `${ticket.accountId}:${ticket.id}`}
            />
          )}
        </TicketGroups>
      </WalletContent>
    </WalletScreen>
  );
}
