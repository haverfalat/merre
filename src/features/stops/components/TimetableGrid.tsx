import { useTranslation } from '@/hooks/useTranslation';
import type { Departure } from '@/lib/stop-departures';
import { formatServiceTime } from '@/lib/transit/time/format';
import { stopTimeKey } from '@/lib/transit/stop-times';
import { contrastTextColor } from '@/lib/transit/colors';
import { cleanTransitLabel, cleanTransitPlaceName } from '@/lib/transit/labels';
import { View, useWindowDimensions } from 'react-native';
import { ListRow } from '~/components/ui/ListRow';
import { Text } from '~/components/ui/Text';
import { metroLineNumber } from '~/lib/metro-label';
import { ModeIcon } from '~/components/ui/transit/ModeIcon';
import { FrontDoorBadge } from '~/components/ui/transit/FrontDoorBadge';
import { FrontDoorNotice } from '~/components/ui/transit/FrontDoorNotice';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { departurePresentation } from '~/features/stops/model/departure-presentation';
import type { timetableHours } from '~/features/stops/model/timetable';
import { controls, fonts, useTheme } from '~/lib/theme';

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
  const { t } = useTranslation();
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
          paddingTop: 6,
          paddingRight: 6,
          borderRightWidth: 1,
          borderColor: c.border,
          textAlign: 'right',
          color: c.text,
          fontFamily: fonts.semibold,
          fontSize: 16,
          lineHeight: 20,
          includeFontPadding: false,
          fontVariant: ['tabular-nums'],
        }}
      >
        {formatServiceTime(row.hour * 3600000).split(':')[0]}
      </Text>
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', columnGap: 4, rowGap: 4 }}>
        {row.departures.map((departure) => {
          const { canceled, epoch, tone } = departurePresentation(departure, now);
          const time = formatServiceTime(epoch! * 1000);
          const label = `${time}, ${cleanTransitLabel(departure.routeLabel)}, ${cleanTransitPlaceName(departure.headsign)}${departure.frontDoor ? `, ${t('front_door_boarding')}` : ''}${canceled ? `, ${t('canceled')}` : ''}`;
          const metroNumber = metroLineNumber(departure.routeLabel, departure.mode);
          const width = Math.max(controls.target, Math.min(112,
            (metroNumber ? metroNumber.length * 6 + 16 : cleanTransitLabel(departure.routeLabel).length * 6) + 12 + (departure.frontDoor ? 14 : 0),
          )) * fontScale;
          return (
            <ListRow
              layout="content"
              key={`${departure.routeId}|${stopTimeKey(departure)}`}
              testID="timetable-departure"
              accessibilityRole="button"
              accessibilityLabel={label}
              disabled={!departure.trip?.id && !departure.trip?.gtfsId}
              onPress={() => onSelect(departure)}
              style={({ pressed }) => ({
                width,
                minWidth: controls.target,
                maxWidth: '100%',
                minHeight: controls.target,
                paddingHorizontal: 3,
                paddingTop: 6,
                paddingBottom: 6,
                gap: 4,
                backgroundColor: pressed ? c.raised : 'transparent',
                alignItems: 'center',
                opacity: canceled ? 0.55 : 1,
              })}
            >
              <Text
                testID="timetable-minute"
                style={{
                  fontFamily: fonts.semibold,
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
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  maxWidth: '100%',
                  paddingHorizontal: 3,
                  borderRadius: 2,
                  backgroundColor: departure.color,
                }}
              >
                {metroNumber && <ModeIcon mode="SUBWAY" size={13 * fontScale}
                  color={contrastTextColor(departure.color)} />}
                <TransitLabel
                  html={metroNumber || departure.routeLabel}
                  numberOfLines={1}
                  style={{
                    fontFamily: fonts.semibold,
                    flexShrink: 1,
                    fontSize: 12,
                    lineHeight: 16,
                    includeFontPadding: false,
                    color: contrastTextColor(departure.color),
                  }}
                />
                {departure.frontDoor && <FrontDoorBadge size={12} />}
              </View>
            </ListRow>
          );
        })}
      </View>
    </View>
  );
}
