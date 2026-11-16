import { useTransitPrefetch } from '~/hooks/useTransitPrefetch';
import { useEffect } from 'react';
import { useNow } from '~/hooks/useNow';
import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { getTransit, transitQueryKey } from '~/lib/transit/service';
import { serviceDate } from '~/lib/transit';
import { isBkkId } from '~/lib/transit/adapters/bkk/normalize';
import { formatServiceTime } from '~/lib/transit/time/format';
import { cleanTransitPlaceName } from '~/lib/transit/labels';
import { fonts, useTheme } from '~/lib/theme';
import type { SelectedVehicle } from '~/store/useMapStore';
import type { TripContinuation as Continuation } from '~/lib/transit/types/trip';
import { useMapStore } from '~/store/useMapStore';

export function useTripContinuation({ id, day, vehicleId }: { id: string; day?: string; vehicleId?: string | null }) {
  const { language } = useTranslation();
  const now = useNow();
  const date = (day ?? serviceDate(now)).replaceAll('-', '');
  const query = useQuery({
    queryKey: transitQueryKey('trip-continuation', language, id, date),
    enabled: isBkkId(id),
    staleTime: 60_000, refetchInterval: 60_000, retry: false,
    queryFn: ({ signal }) => getTransit(signal, language).tripContinuation?.(id, date) ?? null,
  });
  const next = query.data;
  const prefetch = useTransitPrefetch();
  useEffect(() => {
    if (next) prefetch({ kind: 'trip', id: next.tripId, day: next.serviceDay });
  }, [next, prefetch]);
  const selection = useMapStore(state => state.selectedVehicle);
  const tracking = selection?.tripId === id && selection.kind === 'vehicle' && !!vehicleId;
  const fixes = useQuery({
    queryKey: transitQueryKey('continuation-vehicle', language, next?.tripId, next?.serviceDay),
    enabled: tracking && !!next && now / 1000 >= next.departureAt,
    staleTime: 5_000, refetchInterval: 10_000, retry: false,
    queryFn: ({ signal }) => next
      ? getTransit(signal, language).vehiclePositionsForTrip(next.tripId, next.serviceDay)
      : Promise.resolve([]),
  });
  useEffect(() => {
    if (!tracking || !next || now / 1000 < next.departureAt) return;
    const confirmed = fixes.data?.some(fix => fix.vehicleId === vehicleId &&
      (fix.trip?.gtfsId || fix.trip?.id) === next.tripId &&
      fix.trip?.serviceDate?.replaceAll('-', '') === next.serviceDay.replaceAll('-', '') &&
      fix.lastUpdated != null && now / 1000 - fix.lastUpdated >= 0 && now / 1000 - fix.lastUpdated <= 30);
    const current = useMapStore.getState().selectedVehicle;
    if (!confirmed || current?.tripId !== id || current.kind !== 'vehicle') return;
    // Preserve camera mode and map viewport across the confirmed physical vehicle's trip boundary.
    openContinuation(next, { ...current, vehicleId: vehicleId! }, true);
  }, [tracking, next, fixes.data, vehicleId, id, now]);
  return { next, open: () => {
    const current = useMapStore.getState().selectedVehicle;
    if (next && current?.tripId === id) openContinuation(next, current, false);
  } };
}

function openContinuation(next: Continuation, current: SelectedVehicle, automatic: boolean) {
  const store = useMapStore.getState();
  useMapStore.setState({
    selectedVehicle: { kind: automatic ? 'vehicle' : 'trip', tripId: next.tripId,
      serviceDay: next.serviceDay, ...(automatic ? { vehicleId: current.vehicleId } : {}) },
    previousTrips: [...store.previousTrips, current].slice(-20),
    ...(automatic ? {} : { vehicleCameraMode: 'free' as const }),
  });
}

export function TripContinuation({ continuation }: { continuation: ReturnType<typeof useTripContinuation> }) {
  const { t } = useTranslation();
  const c = useTheme();
  const { next, open } = continuation;
  if (!next) return null;
  return <View style={{ padding: 12, gap: 6, borderTopWidth: 1, borderColor: c.border }}>
    <Text style={{ fontFamily: fonts.semibold, fontSize: 15 }}>{t('scheduled_continuation')}</Text>
    <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
      {t('continuation_from', { stop: cleanTransitPlaceName(next.stopName), time: formatServiceTime(next.departureAt * 1000) })}
    </Text>
    <Button variant="ghost" icon={ArrowRight} label={t('continuation_towards', { destination: cleanTransitPlaceName(next.headsign) })}
      onPress={open} />
  </View>;
}
