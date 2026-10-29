import { router } from 'expo-router';
import { ScanLine, Users } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { Button } from '~/components/ui/Button';
import { ActionRow } from '~/components/ui/ActionRow';
import { Empty } from '~/components/ui/Empty';
import { SkeletonRefreshControl } from '~/components/ui/Skeleton';
import { usePullToRefresh } from '~/hooks/usePullToRefresh';
import { useTranslation } from '~/hooks/useTranslation';
import { isWalletTicketAvailable } from '~/lib/tickets/eligibility';
import { feedback } from '~/lib/feedback';
import { elevation, useTheme } from '~/lib/theme';
import { ticketProviders } from '~/lib/tickets/providers.native';
import {
  WalletContent,
  WalletError,
  WalletLoading,
  WalletScreen,
} from '../components/WalletScreen';
import { TicketCard } from '../components/TicketCard';
import { TicketGroups } from '../components/TicketGroups';
import { BoardingPicker } from '../components/BoardingPicker.native';
import { useBoardingController } from '../hooks/useBoardingController.native';
import { useTicketTransfer } from '../hooks/useTicketTransfer.native';
import { useWallet } from '../hooks/useWallet.native';
import { useTicketInspection } from '../hooks/useTicketInspection.native';
import { WalletAccountErrors } from '../components/WalletAccountErrors.native';

export default function WalletHomeScreen() {
  const { t } = useTranslation();
  const c = useTheme();
  const wallet = useWallet();
  const transfers = useTicketTransfer();
  const refreshControl = usePullToRefresh(wallet.refetch);
  const inspection = useTicketInspection();
  const controller = useBoardingController();
  const busy = inspection.busy;
  const tickets = wallet.tickets.filter(isWalletTicketAvailable);
  const canScan = ticketProviders.some(
    (provider) => provider.capabilities.includes('scan') &&
      wallet.accounts.some((account) => account.providerId === provider.id),
  );
  return (
    <>
      <WalletScreen
        title={t('tickets_wallet')}
        actions={
          <Button
            icon={Users}
            label={t('tickets_accounts')}
            onPress={() => router.push('/tickets/accounts')}
          />
        }
      >
        <View style={{ flex: 1 }}>
          <WalletContent
            refreshing={wallet.isFetching && tickets.length > 0}
            contentContainerStyle={{ paddingBottom: canScan ? 96 : 24 }}
            refreshControl={
              wallet.accounts.length ? <SkeletonRefreshControl {...refreshControl} /> : undefined
            }
          >
            <WalletAccountErrors wallet={wallet} />
            {!wallet.error && (!wallet.ready || (wallet.isPending && !tickets.length)) && <WalletLoading variant="tickets" />}
            {wallet.ready && !wallet.accounts.length && (
              <>
                <Empty message={t('tickets_no_accounts')} />
                <ActionRow>
                  <Button
                    variant="primary"
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
                {transfers.error ? <WalletError error={transfers.error} /> : null}
                {inspection.error ? <WalletError error={inspection.error} /> : null}
                {!wallet.isPending && !tickets.length && (
                  <Empty message={t('tickets_no_valid_tickets')} />
                )}
                <TicketGroups tickets={tickets}>
                  {(ticket) => (
                    <TicketCard
                      key={`${ticket.accountId}:${ticket.id}`}
                      ticket={ticket}
                      onTransfer={() => transfers.transfer(ticket)}
                      transferring={transfers.loading === `${ticket.accountId}:${ticket.id}`}
                      busy={busy}
                      loading={inspection.loading === `${ticket.accountId}:${ticket.id}`}
                      onInspect={() => void inspection.inspect(ticket)}
                      onBoard={() =>
                        void controller.start({
                          providerIds: [ticket.providerId],
                          preferredTicket: { accountId: ticket.accountId, ticketId: ticket.id },
                        })
                      }
                    />
                  )}
                </TicketGroups>
              </>
            )}
          </WalletContent>
          {canScan && (
            <Pressable
              testID="wallet-scan"
              accessibilityRole="button"
              accessibilityLabel={t('tickets_scan')}
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={() => {
                feedback();
                router.push('/tickets/scan');
              }}
              style={({ pressed }) => ({
                position: 'absolute',
                right: 16,
                bottom: 16,
                width: 56,
                height: 56,
                borderRadius: 28,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: c.primary,
                boxShadow: elevation.map,
                opacity: busy ? 0.4 : pressed ? 0.7 : 1,
              })}
            >
              <ScanLine size={26} strokeWidth={1.8} color={c.onAccent} />
            </Pressable>
          )}
        </View>
      </WalletScreen>
      <BoardingPicker controller={controller} />
    </>
  );
}
