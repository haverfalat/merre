import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { MapPin, ScanLine, Users } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Button } from '~/components/ui/Button';
import { ActionRow } from '~/components/ui/ActionRow';
import { Empty } from '~/components/ui/Empty';
import { SkeletonRefreshControl } from '~/components/ui/Skeleton';
import { usePullToRefresh } from '~/hooks/usePullToRefresh';
import { useTranslation } from '~/hooks/useTranslation';
import { backendFor, initializeAccounts } from '~/lib/tickets/accounts.native';
import { openTicketPresentation } from '~/lib/tickets/presentation.native';
import { TicketWalletError } from '~/lib/tickets/errors';
import { ticketProviders } from '~/lib/tickets/providers.native';
import type { OwnedWalletTicket } from '~/lib/tickets/types';
import {
  WalletContent,
  WalletError,
  WalletLoading,
  WalletScreen,
} from '../components/WalletScreen';
import { TicketCard } from '../components/TicketCard';
import { BoardingPicker } from '../components/BoardingPicker.native';
import { useBoardingController } from '../hooks/useBoardingController.native';
import { useTicketTransfer } from '../hooks/useTicketTransfer.native';
import { useWallet } from '../hooks/useWallet.native';

export default function WalletHomeScreen() {
  const { t } = useTranslation();
  const wallet = useWallet();
  const transfers = useTicketTransfer();
  const refreshControl = usePullToRefresh(wallet.refetch);
  const cache = useQueryClient();
  const controller = useBoardingController();
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const lock = useRef(false);
  const tickets = wallet.tickets.filter((ticket) => ticket.status === 'VALID');
  const inspect = async (ticket: OwnedWalletTicket) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(`${ticket.accountId}:${ticket.id}`);
    setError(null);
    try {
      const result = await backendFor(ticket.accountId).inspector?.(ticket.id, wallet.language);
      if (!result) throw new TicketWalletError('unavailable');
      const id = openTicketPresentation(result);
      router.push({ pathname: '/tickets/present', params: { id } });
      void cache.invalidateQueries({ queryKey: ['ticket-wallet', ticket.accountId] });
    } catch (error) {
      setError(error);
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };
  return (
    <>
      <WalletScreen
        title={t('tickets_wallet')}
        actions={
          <Button
            icon={Users}
            size="icon"
            label={t('tickets_accounts')}
            onPress={() => router.push('/tickets/accounts')}
          />
        }
      >
        <WalletContent
          refreshControl={
            wallet.accounts.length ? <SkeletonRefreshControl {...refreshControl} /> : undefined
          }
        >
          {wallet.error && (
            <WalletError
              error={new TicketWalletError('identity')}
              retry={() => void initializeAccounts().catch(setError)}
            />
          )}
          {(!wallet.ready || (wallet.isPending && !tickets.length)) && <WalletLoading />}
          {wallet.ready && !wallet.accounts.length && (
            <>
              <Empty message={t('tickets_no_accounts')} />
              <ActionRow>
                <Button
                  label={t('tickets_add_account')}
                  onPress={() => router.push('/tickets/accounts')}
                />
                <Button
                  label={t('tickets_import')}
                  onPress={() => router.push('/tickets/import')}
                />
              </ActionRow>
            </>
          )}
          {!!wallet.accounts.length && (
            <>
              <ActionRow>
                {ticketProviders.some(
                  (provider) =>
                    provider.capabilities.includes('nearby') &&
                    wallet.accounts.some((account) => account.providerId === provider.id),
                ) && (
                  <Button
                    icon={MapPin}
                    label={t('tickets_nearby')}
                    disabled={!!busy || controller.busy}
                    onPress={() => router.push('/tickets/nearby')}
                  />
                )}
                {ticketProviders.some(
                  (provider) =>
                    provider.capabilities.includes('scan') &&
                    wallet.accounts.some((account) => account.providerId === provider.id),
                ) && (
                  <Button
                    icon={ScanLine}
                    label={t('tickets_scan_short')}
                    disabled={!!busy || controller.busy}
                    onPress={() => router.push('/tickets/scan')}
                  />
                )}
              </ActionRow>
              {wallet.failures.map((failure) => (
                <WalletError
                  key={failure.account.id}
                  error={failure.error}
                  retry={() => void wallet.refetch()}
                />
              ))}
              {transfers.error ? <WalletError error={transfers.error} /> : null}
              {error ? <WalletError error={error} /> : null}
              {!wallet.isPending && !tickets.length && (
                <Empty message={t('tickets_no_valid_tickets')} />
              )}
              {tickets.map((ticket) => (
                <TicketCard
                  key={`${ticket.accountId}:${ticket.id}`}
                  ticket={ticket}
                  onTransfer={() => transfers.transfer(ticket)}
                  transferring={transfers.loading === `${ticket.accountId}:${ticket.id}`}
                  busy={!!busy || controller.busy}
                  loading={busy === `${ticket.accountId}:${ticket.id}`}
                  onInspect={() => void inspect(ticket)}
                  onBoard={() =>
                    void controller.start({
                      providerIds: [ticket.providerId],
                      preferredTicket: { accountId: ticket.accountId, ticketId: ticket.id },
                    })
                  }
                />
              ))}
            </>
          )}
        </WalletContent>
      </WalletScreen>
      <BoardingPicker controller={controller} />
    </>
  );
}
