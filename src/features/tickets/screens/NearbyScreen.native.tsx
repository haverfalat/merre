import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { Crosshair, RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ActionRow } from '~/components/ui/ActionRow';
import { Button } from '~/components/ui/Button';
import { Choice } from '~/components/ui/Choice';
import { Empty } from '~/components/ui/Empty';
import { SkeletonRefreshControl } from '~/components/ui/Skeleton';
import { Text } from '~/components/ui/Text';
import { RouteDestination } from '~/components/ui/transit/RouteDestination';
import { usePullToRefresh } from '~/hooks/usePullToRefresh';
import { useTranslation } from '~/hooks/useTranslation';
import { backendFor } from '~/lib/tickets/accounts.native';
import { distanceMeters, isBoardingChoiceFresh } from '~/lib/tickets/boarding';
import { TicketWalletError } from '~/lib/tickets/errors';
import { providerById } from '~/lib/tickets/providers.native';
import type { BoardingChoice, BoardingRequest } from '~/lib/tickets/types';
import { useTheme } from '~/lib/theme';
import { useMapStore } from '~/store/useMapStore';
import { BoardingPicker } from '../components/BoardingPicker.native';
import {
  WalletContent,
  WalletError,
  WalletLoading,
  WalletScreen,
} from '../components/WalletScreen';
import { useBoardingController } from '../hooks/useBoardingController.native';
import { useWallet } from '../hooks/useWallet.native';

export default function NearbyScreen() {
  const params = useLocalSearchParams<{ account?: string; ticket?: string; route?: string }>();
  const wallet = useWallet();
  const { t } = useTranslation();
  const c = useTheme();
  const controller = useBoardingController();
  const [center, setCenter] = useState(() => useMapStore.getState().center);
  const [gps, setGps] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [locating, setLocating] = useState(false);
  const representatives = wallet.accounts.filter(
    (account, index, accounts) =>
      providerById(account.providerId).capabilities.includes('nearby') &&
      accounts.findIndex((other) => other.providerId === account.providerId) === index,
  );
  const query = useQuery({
    queryKey: [
      'ticket-nearby-all',
      representatives.map((account) => [account.id, account.revision]),
      center[0],
      center[1],
    ],
    queryFn: async () => {
      const results = await Promise.allSettled(
        representatives.map(async (account) =>
          ((await backendFor(account.id).nearby?.(center[1], center[0])) ?? []).map((choice) => ({
            ...choice,
            providerId: account.providerId,
          })),
        ),
      );
      const fulfilled = results.flatMap((result) =>
        result.status === 'fulfilled' ? result.value : [],
      );
      if (!fulfilled.length && results.every((result) => result.status === 'rejected'))
        throw new TicketWalletError('network');
      return fulfilled;
    },
    enabled: wallet.ready && representatives.length > 0,
    retry: false,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
  const refreshControl = usePullToRefresh(query.refetch);
  useEffect(() => {
    let alive = true;
    void Location.getForegroundPermissionsAsync()
      .then(async (permission) => {
        if (!permission.granted) return;
        const position =
          (await Location.getLastKnownPositionAsync({ maxAge: 120_000, requiredAccuracy: 200 })) ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (alive) {
          setCenter([position.coords.longitude, position.coords.latitude]);
          setGps(true);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const locate = async () => {
    setLocating(true);
    setLocationError(false);
    try {
      if (!(await Location.requestForegroundPermissionsAsync()).granted) throw new Error();
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCenter([position.coords.longitude, position.coords.latitude]);
      setGps(true);
    } catch {
      setLocationError(true);
    } finally {
      setLocating(false);
    }
  };
  const choices = (query.data ?? [])
    .filter(
      (choice) =>
        !params.route ||
        choice.routeName?.split(' / ').includes(params.route) ||
        choice.routeId === params.route,
    )
    .map((choice) => ({ ...choice, distance: distanceTo(choice, center) }))
    .sort((a, b) => a.distance - b.distance);
  const requestFor = (choice: BoardingChoice & { providerId: string }): BoardingRequest => ({
    target: choice.target,
    providerIds: [choice.providerId],
    ...(params.account && params.ticket
      ? { preferredTicket: { accountId: params.account, ticketId: params.ticket } }
      : {}),
  });
  return (
    <>
      <WalletScreen title={t('tickets_nearby')}>
        <WalletContent refreshControl={<SkeletonRefreshControl {...refreshControl} />}>
          <ActionRow>
            <Text style={{ flex: 1, fontSize: 11, color: c.muted }}>
              {gps ? t('tickets_gps_center') : t('tickets_map_center')}
            </Text>
            <Button
              icon={Crosshair}
              size="icon"
              label={t('tickets_location')}
              loading={locating}
              disabled={locating}
              onPress={() => void locate()}
            />
            <Button
              icon={RefreshCw}
              size="icon"
              label={t('tickets_refresh')}
              onPress={() => void query.refetch()}
            />
          </ActionRow>
          {locationError && <Text style={{ fontSize: 12 }}>{t('tickets_error_location')}</Text>}
          {!wallet.ready || (query.isPending && representatives.length > 0) ? (
            <WalletLoading />
          ) : null}
          {query.error ? (
            <WalletError error={query.error} retry={() => void query.refetch()} />
          ) : null}
          {wallet.ready && !wallet.accounts.length && (
            <Button
              label={t('tickets_add_account')}
              onPress={() => router.push('/tickets/accounts')}
            />
          )}
          {!query.isPending && !choices.length && <Empty message={t('tickets_nearby_empty')} />}
          {choices.map((choice) => {
            const handlers = controller.pressHandlers(requestFor(choice));
            return (
              <Choice
                key={`${choice.providerId}:${choice.id}`}
                kind="radio"
                checked={false}
                label={choice.title}
                disabled={controller.busy}
                accessibilityHint={t('tickets_long_press_switch')}
                {...handlers}
                onPress={() => {
                  if (isBoardingChoiceFresh(choice)) handlers.onPress();
                  else void query.refetch();
                }}
              >
                <View style={{ flex: 1, gap: 5 }}>
                  <RouteDestination
                    label={choice.routeName}
                    destination={choice.headsign ?? choice.title}
                    mode={choice.mode}
                    color={choice.color}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Text style={{ flex: 1, fontSize: 11, color: c.secondary }}>
                      {choice.kind === 'metro' ? t('tickets_metro_entry') : choice.subtitle}
                    </Text>
                    <Text style={{ fontSize: 11, color: c.muted, fontVariant: ['tabular-nums'] }}>
                      {t('tickets_distance_m', { distance: Math.round(choice.distance) })}
                    </Text>
                  </View>
                </View>
              </Choice>
            );
          })}
        </WalletContent>
      </WalletScreen>
      <BoardingPicker controller={controller} />
    </>
  );
}
function distanceTo(choice: BoardingChoice, center: number[]) {
  return choice.latitude !== undefined && choice.longitude !== undefined
    ? distanceMeters(center[1], center[0], choice.latitude, choice.longitude)
    : Infinity;
}
