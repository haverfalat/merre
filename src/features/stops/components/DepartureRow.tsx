import { useTranslation } from '@/hooks/useTranslation';
import type { Departure } from '@/lib/stop-departures';
import { cleanTransitLabel } from '@/lib/transit/labels';
import { View, useWindowDimensions } from 'react-native';
import { ListRow } from '~/components/ui/ListRow';
import { Text } from '~/components/ui/Text';
import { RouteDestination } from '~/components/ui/transit/RouteDestination';
import { TimeAndDelay } from '~/components/ui/transit/TimeAndDelay';
import { PlatformCell } from '~/components/ui/transit/PlatformCell';
import { BOARD_TABLE, stopBoardTableLayout } from '~/lib/transit-table';
import { departurePresentation } from '~/features/stops/model/departure-presentation';
import { fonts, useTheme } from '~/lib/theme';
import type { BoardDirection } from '~/features/stops/model/station-board-model';

export function DepartureRow({
  departure: dep,
  now,
  onPress,
  direction = 'departures',
  showPlatform = false,
  next = false,
}: {
  departure: Departure;
  now: number;
  onPress: () => void;
  direction?: BoardDirection;
  showPlatform?: boolean;
  next?: boolean;
}) {
  const c = useTheme();
  const { t } = useTranslation();
  const { width, fontScale } = useWindowDimensions();
  const { reflow, timeWidth } = stopBoardTableLayout(width, fontScale);
  const { canceled, live, minutes, delaySeconds, tone, surface, time, showCountdown } = departurePresentation(
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
  return (
    <ListRow
      accessibilityLabel={`${dep.routeLabel}, ${cleanTransitLabel(dep.headsign)}, ${countdown}, ${t(live ? 'estimated' : 'scheduled')}${dep.frontDoor ? `, ${t('front_door_boarding')}` : ''}`}
      disabled={!dep.trip?.gtfsId && !dep.trip?.id}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingLeft: 10,
        paddingRight: BOARD_TABLE.paddingRight,
        paddingVertical: 6,
        minHeight: 52,
        borderBottomWidth: 1,
        borderColor: c.border,
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: BOARD_TABLE.gap,
        borderLeftWidth: 3,
        borderLeftColor: next ? c.accent : 'transparent',
        backgroundColor: pressed ? c.raised : next ? c.surface : 'transparent',
      })}
    >
      <View style={{ flex: 1, minWidth: 0, flexDirection: reflow ? 'column' : 'row', gap: BOARD_TABLE.gap, alignItems: reflow ? 'stretch' : 'center' }}>
        <View style={{ flexGrow: reflow ? 0 : 1, flexShrink: 1, flexBasis: reflow ? 'auto' : 0, minWidth: 0 }}>
          <RouteDestination
            leading="mode"
            label={dep.routeLabel}
            mode={dep.mode}
            color={dep.color}
            destination={dep.headsign}
            size="compact"
            lines={2}
            direction={direction === 'arrivals' ? 'incoming' : 'outgoing'}
            boarding={dep.frontDoor ? 'front-door' : 'none'}
          />
        </View>
        <View
          style={{
            flexShrink: 0,
            width: reflow ? undefined : timeWidth,
            alignItems: reflow ? 'flex-start' : 'flex-end',
            gap: 2,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              paddingHorizontal: 5,
              paddingVertical: 3,
              borderRadius: 2,
              backgroundColor: c[surface],
              fontFamily: fonts.semibold,
              fontVariant: ['tabular-nums'],
              color: c[tone],
            }}
          >
            {countdown}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: reflow ? 'flex-start' : 'flex-end',
              columnGap: 6,
              rowGap: 2,
            }}
          >
            <TimeAndDelay
              label={showCountdown || canceled ? time : undefined}
              seconds={delaySeconds}
              color={c[tone]}
              canceled={canceled}
            />
          </View>
        </View>
      </View>
      {showPlatform && <PlatformCell value={dep.stop?.platformCode} />}
    </ListRow>
  );
}
