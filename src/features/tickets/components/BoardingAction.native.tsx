import { useEffect } from 'react';
import { View } from 'react-native';
import { Ticket } from 'lucide-react-native';
import { Button } from '~/components/ui/Button';
import { useTranslation } from '~/hooks/useTranslation';
import type { BoardingActionProps } from './boarding-action-types';
import { isBkkRoute } from '~/lib/transit/agency';
import { useBoardingController } from '../hooks/useBoardingController.native';
import { BoardingPicker } from './BoardingPicker.native';
import { ServiceTicketAction } from './ServiceTicketAction.native';
import { initializeAccounts, useTicketAccounts } from '~/lib/tickets/accounts.native';
import { ticketProviders } from '~/lib/tickets/providers.native';

export function BoardingAction({ route, licensePlate, tripName, serviceDay, tripId, vehicleId }: BoardingActionProps) {
  const { t } = useTranslation();
  const accountsReady = useTicketAccounts((state) => state.ready);
  useEffect(() => { void initializeAccounts().catch(() => {}); }, []);
  const controller = useBoardingController();
  const hasServiceAccounts = useTicketAccounts((state) =>
    state.accounts.some((account) =>
      ticketProviders.some(
        (provider) => provider.id === account.providerId && !!provider.matchesService,
      ),
    ),
  );
  const boardingAccount = useTicketAccounts((state) => state.accounts.find((account) => account.providerId === 'budapestgo'));
  const bkk = isBkkRoute(route);
  if (!route) return null;
  if (bkk && accountsReady && !boardingAccount) return null;
  if (!bkk) return hasServiceAccounts ? (
    <ServiceTicketAction service={{ routeName: route.shortName ?? '', routeId: route.gtfsId ?? route.id ?? '',
      tripName: tripName ?? '', serviceDay }} />
  ) : null;
  const request = {
    providerIds: ['budapestgo'],
    ...(tripId ? { trip: { id: tripId, serviceDay, vehicleId } } : {}),
    service: {
      routeId: route.gtfsId ?? route.id ?? '',
      routeName: route.shortName ?? '',
      agencyId: route.agency?.gtfsId ?? route.agency?.id ?? '',
      agencyName: route.agency?.name ?? '',
    },
    route: route.shortName ?? '',
    ...(licensePlate
      ? {
          target: {
            kind: 'vehicle',
            licensePlate,
            title: `${route.shortName ?? ''} · ${licensePlate}`,
          },
        }
      : {}),
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Button
        icon={Ticket}
        size="icon"
        label={t('tickets_present')}
        accessibilityHint={t('tickets_long_press_switch')}
        loading={controller.loading || !accountsReady}
        disabled={controller.busy || !accountsReady}
        {...controller.pressHandlers(request)}
      />
      <BoardingPicker controller={controller} />
    </View>
  );
}
