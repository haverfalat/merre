import { Ticket } from 'lucide-react-native';
import { Button } from '~/components/ui/Button';
import { useTranslation } from '~/hooks/useTranslation';
import { isBkkRoute, type BoardingActionProps } from './boarding-action-types';
import { useBoardingController } from '../hooks/useBoardingController.native';
import { BoardingPicker } from './BoardingPicker.native';
import { ServiceTicketAction } from './ServiceTicketAction.native';
import { useTicketAccounts } from '~/lib/tickets/accounts.native';
import { ticketProviders } from '~/lib/tickets/providers.native';

export function BoardingAction({ route, licensePlate, tripName, serviceDay }: BoardingActionProps) {
  const { t } = useTranslation();
  const controller = useBoardingController();
  const hasServiceAccounts = useTicketAccounts((state) =>
    state.accounts.some((account) =>
      ticketProviders.some(
        (provider) => provider.id === account.providerId && !!provider.matchesService,
      ),
    ),
  );
  if (!route) return null;
  if (!isBkkRoute(route))
    return hasServiceAccounts ? (
      <ServiceTicketAction
        service={{
          routeName: route.shortName ?? '',
          routeId: route.gtfsId ?? route.id ?? '',
          tripName: tripName ?? '',
          serviceDay,
        }}
      />
    ) : null;
  const request = {
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
    <>
      <Button
        icon={Ticket}
        size="icon"
        label={t('tickets_present')}
        accessibilityHint={t('tickets_long_press_switch')}
        loading={controller.loading}
        disabled={controller.busy}
        {...controller.pressHandlers(request)}
      />
      <BoardingPicker controller={controller} />
    </>
  );
}
