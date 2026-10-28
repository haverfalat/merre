import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import { Ticket } from 'lucide-react-native';
import { Button } from '~/components/ui/Button';
import { useTranslation } from '~/hooks/useTranslation';
import { isBkkRoute, type BoardingActionProps } from './boarding-action-types';
import { useBoardingController } from '../hooks/useBoardingController.native';
import { BoardingPicker } from './BoardingPicker.native';
import { ServiceTicketAction } from './ServiceTicketAction.native';
import { backendFor, initializeAccounts, useTicketAccounts } from '~/lib/tickets/accounts.native';
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
  const support = useQuery({
    queryKey: ['ticket-vehicle-support', boardingAccount?.id, boardingAccount?.revision, licensePlate],
    queryFn: () => boardingAccount && licensePlate
      ? backendFor(boardingAccount.id).supportsVehicle?.(licensePlate) ?? false : false,
    enabled: !bkk && !!boardingAccount && !!licensePlate,
    staleTime: 3_600_000,
    retry: false,
  });
  if (!route) return null;
  if (bkk && accountsReady && !boardingAccount) return null;
  const serviceTicket = !bkk && hasServiceAccounts ? (
    <ServiceTicketAction service={{ routeName: route.shortName ?? '', routeId: route.gtfsId ?? route.id ?? '',
      tripName: tripName ?? '', serviceDay }} />
  ) : null;
  if (!bkk && support.data !== true) return serviceTicket;
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
      {serviceTicket}
      <Button
        icon={Ticket}
        size="icon"
        label={bkk ? t('tickets_present') : 'BudapestGO'}
        accessibilityHint={t('tickets_long_press_switch')}
        loading={controller.loading || !accountsReady}
        disabled={controller.busy || !accountsReady}
        {...controller.pressHandlers(request)}
      />
      <BoardingPicker controller={controller} />
    </View>
  );
}
