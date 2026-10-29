import { useTranslation } from '@/hooks/useTranslation';
import type { Departure } from '@/lib/stop-departures';
import { cleanTransitLabel } from '@/lib/transit/labels';
import { View } from 'react-native';
import { usePanelDimensions } from '~/components/panels/PanelLayout';
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
  const { width, fontScale } = usePanelDimensions();
  const { reflow, timeWidth } = stopBoardTableLayout(width, fontScale);
  const { canceled, live, minutes, delaySeconds, tone, time, showCountdown } = departurePresentation(
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
  const displayCountdown = !canceled && minutes != null && minutes > 1 && showCountdown
    ? t('departure_countdown', { min: minutes })
    : countdown;
  return (
    <ListRow
      accessibilityLabel={`${dep.routeLabel}, ${cleanTransitLabel(dep.headsign)}, ${countdown}, ${t(live ? 'estimated' : 'scheduled')}${dep.frontDoor ? `, ${t('front_door_boarding')}` : ''}`}
      disabled={!dep.trip?.gtfsId && !dep.trip?.id}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingLeft: BOARD_TABLE.paddingLeft,
        paddingRight: BOARD_TABLE.paddingRight,
        paddingVertical: 8,
        minHeight: 64,
        borderBottomWidth: 1,
        borderColor: c.border,
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: BOARD_TABLE.gap,
        backgroundColor: pressed ? c.raised : next ? c.surface : 'transparent',
      })}
    >
      <View style={{ flex: 1, minWidth: 0, flexDirection: reflow ? 'column' : 'row', gap: BOARD_TABLE.gap, alignItems: reflow ? 'stretch' : 'center' }}>
        <View style={{ flexGrow: reflow ? 0 : 1, flexShrink: 1, flexBasis: reflow ? 'auto' : 0, minWidth: 0, gap: 4 }}>
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
          {!canceled && time !== '--:--' && (
            <Text style={{ fontSize: 12, lineHeight: 16, color: c.muted }}>
              {t(live ? 'estimated' : 'scheduled')}
            </Text>
          )}
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
              fontSize: 18,
              lineHeight: 24,
              fontFamily: fonts.semibold,
              fontVariant: ['tabular-nums'],
              color: c[tone],
            }}
          >
            {displayCountdown}
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
              size={13}
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
