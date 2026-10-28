import { useTranslation } from '@/hooks/useTranslation';
import type { Departure } from '@/lib/stop-departures';
import { TRANSIT_TIME_ZONE } from '@/lib/transit';
import { contrastTextColor } from '@/lib/transit/colors';
import { cleanTransitLabel, cleanTransitPlaceName } from '@/lib/transit/labels';
import { View, useWindowDimensions } from 'react-native';
import { ListRow } from '~/components/ui/ListRow';
import { Text } from '~/components/ui/Text';
import { FrontDoorBadge } from '~/components/ui/transit/FrontDoorBadge';
import { FrontDoorNotice } from '~/components/ui/transit/FrontDoorNotice';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { departurePresentation } from '~/features/stops/model/departure-presentation';
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
  const { fontScale } = useWindowDimensions();
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
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderColor: c.border,
        gap: 6,
      }}
    >
      <Text
        style={{
          width: 28 * fontScale,
          flexShrink: 0,
          paddingTop: 10 * fontScale,
          paddingRight: 6,
          borderRightWidth: 1,
          borderColor: c.border,
          textAlign: 'right',
          color: c.muted,
          fontFamily: fonts.mono,
          fontSize: 16,
          lineHeight: 20,
          includeFontPadding: false,
          fontVariant: ['tabular-nums'],
        }}
      >
        {formatter.format(row.hour * 3600000).split(':')[0]}
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', columnGap: 4, rowGap: 4 }}>
        {row.departures.map((departure, index) => {
          const { canceled, epoch, tone } = departurePresentation(departure, now);
          const time = formatter.format(epoch! * 1000);
          const label = `${time}, ${cleanTransitLabel(departure.routeLabel)}, ${cleanTransitPlaceName(departure.headsign)}${departure.frontDoor ? `, ${t('front_door_boarding')}` : ''}${canceled ? `, ${t('canceled')}` : ''}`;
          const width = Math.max(34, Math.min(96,
            cleanTransitLabel(departure.routeLabel).length * 5 + 4 + (departure.frontDoor ? 12 : 0),
          )) * fontScale;
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
                maxWidth: '100%',
                minHeight: 32,
                paddingHorizontal: 3,
                paddingTop: 10 * fontScale,
                paddingBottom: 2,
                backgroundColor: pressed ? c.raised : 'transparent',
                alignItems: 'center',
                opacity: canceled ? 0.55 : 1,
              })}
            >
              <Text
                testID="timetable-minute"
                style={{
                  fontFamily: fonts.mono,
                  fontVariant: ['tabular-nums'],
                  fontSize: 16,
                  lineHeight: 20,
                  includeFontPadding: false,
                  color: c[tone],
                  textDecorationLine: canceled ? 'line-through' : 'none',
                }}
              >
                {time.split(':')[1]}
              </Text>
              <View
                testID="timetable-route"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 1,
                  maxWidth: width - (departure.frontDoor ? 14 : 2),
                  paddingHorizontal: 2,
                  borderRadius: 2,
                  backgroundColor: departure.color,
                }}
              >
                <TransitLabel
                  html={departure.routeLabel}
                  numberOfLines={1}
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 8,
                    lineHeight: 10,
                    includeFontPadding: false,
                    color: contrastTextColor(departure.color),
                  }}
                />
              </View>
              {departure.frontDoor && (
                <View style={{ position: 'absolute', top: 0, left: 1 }}>
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
