import { useQueries } from '@tanstack/react-query';
import { useNetworkState } from 'expo-network';
import { useEffect } from 'react';
import { initializeAccounts, useTicketAccounts } from '~/lib/tickets/accounts.native';
import { ticketQueryOptions } from '~/lib/tickets/queries.native';
import { useTranslation } from '~/hooks/useTranslation';

export function MavOfflineSync() {
  const state = useTicketAccounts();
  const network = useNetworkState();
  const { language } = useTranslation();
  useEffect(() => { void initializeAccounts().catch(() => {}); }, []);
  useQueries({ queries: state.accounts.filter(a => a.providerId === 'mav').map(account => ({
    ...ticketQueryOptions(account, language),
    enabled: state.ready && (network.isInternetReachable ?? network.isConnected) !== false,
    refetchInterval: 60_000,
  })) });
  return null;
}
