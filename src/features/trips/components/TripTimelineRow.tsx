import { useTranslation } from '@/hooks/useTranslation';
import { ScheduleTime } from '~/components/ui/transit/ScheduleTime';
import type { TripTimelineItem as Item } from '~/features/trips/model/trip-timeline';

import type { timelineProgress } from '@/lib/timeline-progress';

import { normalizeHexColor } from '@/lib/transit/colors';

import { cleanTransitPlaceName } from '@/lib/transit/labels';

import { isRailMode } from '@/lib/transit/modes';

import { View } from 'react-native';

import { timelinePosition } from '~/components/panels/timeline-types';

import { TimelineRow } from '~/components/panels/TimelineRow';

import { Text } from '~/components/ui/Text';

import { FrontDoorBadge } from '~/components/ui/transit/FrontDoorBadge';

import { TransitLabel } from '~/components/ui/transit/TransitLabel';

import { stopFrontDoorBoarding } from '~/lib/boarding-policy';

import { fonts, useTheme } from '~/lib/theme';
export function TripTimelineRow({
  item,
  index,
  items,
  progress,
  mode,
  color,
  onSelect,
  frontDoor = false,
}: {
  frontDoor?: boolean;
  item: Item;
  index: number;
  items: Item[];
  progress: ReturnType<typeof timelineProgress>;
  mode?: string | null;
  color: string;
  onSelect: () => void;
}) {
  const c = useTheme();
  const { t } = useTranslation();
  const { stop, time } = item;
  const first = index === 0;
  const last = index === items.length - 1;
  const canceled = time?.realtimeState === 'CANCELED' || time?.realtimeState === 'SKIPPED';
  const passed = !!time && (progress.nextIndex === -1 || index < progress.nextIndex);
  const current = index === progress.nextIndex;
  const train = isRailMode(mode);
  const boarding = stopFrontDoorBoarding(time, index, items.length, frontDoor);
  const platform = 'platformCode' in stop ? stop.platformCode : null;
  const platformColor = normalizeHexColor(time?.platformColor) || c.secondary;
  const between =
    progress.between?.afterStopIndex === index
      ? {
          fraction: progress.between.fraction,
          label:
            t('vehicle_between_stops', {
              from: cleanTransitPlaceName(stop.name),
              to: cleanTransitPlaceName(items[index + 1]?.stop.name),
            }) + (progress.between.estimated ? ` · ${t('estimated')}` : ''),
        }
      : null;
  return (
    <TimelineRow
      color={color}
      mode={mode}
      appearance={{
        tone: canceled ? 'canceled' : passed ? 'passed' : 'default',
        emphasis: current ? 'strong' : 'normal',
      }}
      position={timelinePosition(index, items.length)}
      disabled={!stop.id && !('gtfsId' in stop && stop.gtfsId)}
      onPress={onSelect}
      vehicle={
        between
          ? { kind: 'between', ...between }
          : !!time && index === progress.atStopIndex
            ? { kind: 'at-stop' }
            : undefined
      }
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 44 }}>
        <View
          testID={`trip-stop-${index}`}
          style={{
            flex: 1,
            paddingHorizontal: 7,
            paddingVertical: 7,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <TransitLabel
            html={stop.name || t('station')}
            placeName
            style={{
              flexShrink: 1,
              fontSize: 12,
              fontFamily: current ? fonts.semibold : fonts.regular,
              color: canceled ? c.danger : passed ? c.muted : c.text,
              textDecorationLine: canceled ? 'line-through' : 'none',
            }}
          />
          {boarding && <FrontDoorBadge size={16} />}
        </View>
        {time &&
          (train ? (
            <>
              <View style={{ width: 44, paddingHorizontal: 2 }}>
                {!first || last ? (
                  <ScheduleTime
                    scheduled={time.scheduledArrival}
                    realtime={time.realtimeArrival}
                    delay={time.arrivalDelay}
                    canceled={canceled}
                  />
                ) : (
                  <Text style={{ textAlign: 'right', color: c.muted, fontSize: 10 }}>—</Text>
                )}
              </View>
              <View style={{ width: 44, paddingHorizontal: 2 }}>
                {!last || first ? (
                  <ScheduleTime
                    scheduled={time.scheduledDeparture}
                    realtime={time.realtimeDeparture}
                    delay={time.departureDelay}
                    canceled={canceled}
                  />
                ) : (
                  <Text style={{ textAlign: 'right', color: c.muted, fontSize: 10 }}>—</Text>
                )}
              </View>
              <View style={{ width: 30, alignItems: 'center' }}>
                <Text
                  accessibilityLabel={platform ? `${t('platform')} ${platform}` : undefined}
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    color: platformColor,
                    borderWidth: platform ? 1 : 0,
                    borderColor: platformColor,
                    borderRadius: 3,
                    paddingHorizontal: 2,
                    paddingVertical: 1,
                  }}
                >
                  {platform || '—'}
                </Text>
              </View>
            </>
          ) : (
            <ScheduleTime
              scheduled={time.scheduledDeparture ?? time.scheduledArrival}
              realtime={time.realtimeDeparture ?? time.realtimeArrival}
              delay={time.departureDelay ?? time.arrivalDelay}
              canceled={canceled}
            />
          ))}
      </View>
    </TimelineRow>
  );
}
