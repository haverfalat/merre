import { useTranslation } from '@/hooks/useTranslation';
import type { Departure } from '@/lib/stop-departures';
import { TRANSIT_TIME_ZONE } from '@/lib/transit';
import { cleanTransitLabel, cleanTransitPlaceName } from '@/lib/transit/labels';
import { View } from 'react-native';
import { ListRow } from '~/components/ui/ListRow';
import { Text } from '~/components/ui/Text';
import { FrontDoorBadge } from '~/components/ui/transit/FrontDoorBadge';
import { FrontDoorNotice } from '~/components/ui/transit/FrontDoorNotice';
import { RouteBadge } from '~/components/ui/transit/RouteBadge';
import { boardTiming } from '~/features/stops/model/station-board-model';
import type { timetableHours } from '~/features/stops/model/timetable';
import { fonts, useTheme } from '~/lib/theme';

export function TimetableLegend({ departures }: { departures: Departure[] }) {
  return departures.some((departure) => departure.frontDoor) ? (
    <FrontDoorNotice size="compact" />
  ) : null;
}

export function TimetableHour({
  row,
  now,
  onSelect,
}: {
  row: ReturnType<typeof timetableHours>[number];
  now: number;
  onSelect: (departure: Departure) => void;
}) {
  const c = useTheme();
  const { language, t } = useTranslation();
  const formatter = new Intl.DateTimeFormat(language === 'hu' ? 'hu-HU' : 'en-GB', {
    timeZone: TRANSIT_TIME_ZONE,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <View
      testID="timetable-hour"
      style={{
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderColor: c.border,
        gap: 5,
      }}
    >
      <Text
        style={{
          width: 24,
          paddingTop: 7,
          textAlign: 'center',
          color: c.muted,
          fontFamily: fonts.mono,
          fontSize: 12,
        }}
      >
        {formatter.format(row.hour * 3600000).split(':')[0]}
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {row.departures.map((departure, index) => {
          const canceled =
            departure.realtimeState === 'CANCELED' || departure.realtimeState === 'SKIPPED';
          const { epoch, delay } = boardTiming(departure, 'departures');
          const time = formatter.format(epoch! * 1000);
          const label = `${time}, ${cleanTransitLabel(departure.routeLabel)}, ${cleanTransitPlaceName(departure.headsign)}${departure.frontDoor ? `, ${t('front_door_boarding')}` : ''}${canceled ? `, ${t('canceled')}` : ''}`;
          const width = Math.max(
            36,
            Math.min(
              96,
              cleanTransitLabel(departure.routeLabel).length * 5 + (departure.frontDoor ? 16 : 8),
            ),
          );
          return (
            <ListRow
              layout="content"
              key={`${departure.trip?.gtfsId}|${epoch}|${departure.stop?.id}|${index}`}
              testID="timetable-departure"
              accessibilityRole="button"
              accessibilityLabel={label}
              disabled={!departure.trip?.id && !departure.trip?.gtfsId}
              onPress={() => onSelect(departure)}
              style={({ pressed }) => ({
                width,
                minHeight: 32,
                paddingTop: 10,
                paddingHorizontal: 3,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 5,
                backgroundColor: pressed ? c.raised : c.surface,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canceled ? 0.55 : 1,
              })}
            >
              <View
                testID="timetable-route"
                style={{
                  position: 'absolute',
                  top: 1,
                  left: 1,
                  maxWidth: width - (departure.frontDoor ? 14 : 4),
                }}
              >
                <RouteBadge
                  label={departure.routeLabel}
                  mode={departure.mode}
                  color={departure.color}
                  size="tiny"
                />
              </View>
              <Text
                testID="timetable-minute"
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 12,
                  lineHeight: 16,
                  includeFontPadding: false,
                  textDecorationLine: canceled ? 'line-through' : 'none',
                  color: canceled
                    ? c.danger
                    : epoch! < now / 1000
                      ? c.muted
                      : (delay ?? 0) > 60
                        ? c.warning
                        : c.text,
                }}
              >
                {time.split(':')[1]}
              </Text>
              {departure.frontDoor && (
                <View style={{ position: 'absolute', top: 1, right: 1 }}>
                  <FrontDoorBadge size={10} />
                </View>
              )}
            </ListRow>
          );
        })}
      </View>
    </View>
  );
}
