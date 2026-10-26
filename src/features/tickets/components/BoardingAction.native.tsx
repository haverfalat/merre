import { Ticket } from 'lucide-react-native';
import { Button } from '~/components/ui/Button';
import { useTranslation } from '~/hooks/useTranslation';
import { isBkkRoute, type BoardingActionProps } from './boarding-action-types';
import { useBoardingController } from '../hooks/useBoardingController.native';
import { BoardingPicker } from './BoardingPicker.native';

export function BoardingAction({ route, licensePlate }: BoardingActionProps) {
  const { t } = useTranslation();
  const controller = useBoardingController();
  if (!route || !isBkkRoute(route)) return null;
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
