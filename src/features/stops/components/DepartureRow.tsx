import { useTranslation } from '@/hooks/useTranslation';
import type { Departure } from '@/lib/stop-departures';
import { cleanTransitLabel } from '@/lib/transit/labels';
import { View } from 'react-native';
import { ListRow } from '~/components/ui/ListRow';
import { Text } from '~/components/ui/Text';
import { RouteDestination } from '~/components/ui/transit/RouteDestination';
import { departurePresentation } from '~/features/stops/model/departure-presentation';
import { fonts, useTheme } from '~/lib/theme';

import type { BoardDirection } from '~/features/stops/model/station-board-model';

export function DepartureRow({
  departure: dep,
  now,
  onPress,
  direction = 'departures',
  showPlatform = false,
}: {
  departure: Departure;
  now: number;
  onPress: () => void;
  direction?: BoardDirection;
  showPlatform?: boolean;
}) {
  const c = useTheme();
  const { t } = useTranslation();
  const { canceled, live, minutes, delay, time, showCountdown } = departurePresentation(
    dep,
    now,
    direction,
  );
  const countdown = canceled
    ? t('canceled')
    : minutes == null
      ? time
      : minutes < 0
        ? t(direction === 'arrivals' ? 'arrived' : 'left')
        : minutes <= 1
          ? t('now')
          : showCountdown
            ? t(direction === 'arrivals' ? 'arrival_in' : 'departure_in', { min: minutes })
            : time;
  const delayTone =
    delay.status === 'minor_delay'
      ? c.warning
      : delay.status === 'major_delay'
        ? c.danger
        : delay.status === 'early'
          ? c.accent
          : delay.status === 'on_time'
            ? c.success
            : c.muted;
  const tone = canceled
    ? c.danger
    : minutes != null && minutes < 0
      ? c.muted
      : minutes != null && minutes <= 1
        ? c.accent
        : live
          ? delay.status === 'unknown'
            ? c.success
            : delayTone
          : c.secondary;
  return (
    <ListRow
      accessibilityRole="button"
      accessibilityLabel={`${dep.routeLabel}, ${direction === 'arrivals' ? t('arriving_from', { origin: cleanTransitLabel(dep.headsign) }) : dep.headsign}, ${countdown}${dep.frontDoor ? `, ${t('front_door_boarding')}` : ''}`}
      disabled={!dep.trip?.gtfsId && !dep.trip?.id}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 10,
        paddingVertical: 7,
        minHeight: 48,
        borderBottomWidth: 1,
        borderColor: c.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: pressed ? c.raised : 'transparent',
      })}
    >
      <View style={{ flex: 1, gap: 3, opacity: canceled ? 0.6 : 1 }}>
        <RouteDestination
          leading="mode"
          label={dep.routeLabel}
          mode={dep.mode}
          color={dep.color}
          destination={
            direction === 'arrivals'
              ? t('arriving_from', { origin: dep.headsign })
              : dep.headsign
          }
          size="compact"
          boarding={dep.frontDoor ? 'front-door' : 'none'}
          direction={direction === 'arrivals' ? 'incoming' : 'outgoing'}
          lines={2}
        />
      </View>
      <View style={{ width: 88, alignItems: 'flex-end', gap: 3 }}>
        <Text
          accessibilityHint={t(live ? 'estimated' : 'scheduled')}
          style={{
            fontSize: 12,
            fontFamily: fonts.semibold,
            color: tone,
            backgroundColor: `${tone}18`,
            borderWidth: 1,
            borderColor: `${tone}40`,
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 5,
          }}
        >
          {countdown}
        </Text>
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
          {(showCountdown || canceled) && (
            <Text
              style={{
                fontFamily: fonts.mono,
                fontSize: 10,
                color: c.muted,
                textDecorationLine: canceled ? 'line-through' : 'none',
              }}
            >
              {time}
            </Text>
          )}
          {!canceled && delay.minutes !== 0 && (
            <Text style={{ fontSize: 10, color: delayTone }}>
              {delay.minutes > 0
                ? t('delay_min', { min: delay.minutes })
                : t('early', { min: Math.abs(delay.minutes) })}
            </Text>
          )}
        </View>
      </View>
      {showPlatform && (
        <View
          style={{
            width: 30,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'stretch',
          }}
        >
          <Text
            accessibilityLabel={`${t('platform')} ${dep.stop?.platformCode || '—'}`}
            style={{ fontFamily: fonts.mono, fontSize: 11, color: c.secondary }}
          >
            {dep.stop?.platformCode || '—'}
          </Text>
        </View>
      )}
    </ListRow>
  );
}
