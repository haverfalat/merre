import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Empty } from '~/components/ui/Empty';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { initializeAccounts, useTicketAccounts } from '~/lib/tickets/accounts.native';
import { ownedTickets, ticketQueryOptions } from '~/lib/tickets/queries.native';
import { useTicketTransfer } from '../hooks/useTicketTransfer.native';
import { TicketCard } from '../components/TicketCard';
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
    ? ownedTickets(account, query.data ?? []).filter((ticket) => ticket.status !== 'VALID')
    : [];
  return (
    <WalletScreen title={t('tickets_inactive_tickets')}>
      <WalletContent>
        {account && <Text style={{ fontSize: 12 }}>{account.label}</Text>}
        {(!ready || (account && query.isPending)) && <WalletLoading />}
        {error || query.error ? (
          <WalletError error={error ?? query.error} retry={() => void query.refetch()} />
        ) : null}
        {ready && !query.isPending && !tickets.length && (
          <Empty message={t('tickets_no_inactive_tickets')} />
        )}
        {transfers.error ? <WalletError error={transfers.error} /> : null}
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            busy={transfers.busy}
            onTransfer={() => transfers.transfer(ticket)}
            transferring={transfers.loading === `${ticket.accountId}:${ticket.id}`}
          />
        ))}
      </WalletContent>
    </WalletScreen>
  );
}
