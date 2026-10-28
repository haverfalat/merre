import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { ScheduleTime } from '~/components/ui/transit/ScheduleTime';
import type { TripTimelineItem as Item } from '~/features/trips/model/trip-timeline';
import type { timelineProgress } from '@/lib/timeline-progress';
import { normalizeHexColor } from '@/lib/transit/colors';
import { cleanTransitPlaceName } from '@/lib/transit/labels';
import { View, useWindowDimensions } from 'react-native';
import { timelinePosition } from '~/components/panels/timeline-types';
import { TimelineRow } from '~/components/panels/TimelineRow';
import { Text } from '~/components/ui/Text';
import { FrontDoorBadge } from '~/components/ui/transit/FrontDoorBadge';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { stopFrontDoorBoarding } from '~/lib/boarding-policy';
import { fonts, useTheme } from '~/lib/theme';
import { tripTableLayout } from '~/lib/transit-table';
import { PlatformCell } from '~/components/ui/transit/PlatformCell';
export function TripTimelineRow({
  item,
  index,
  items,
  progress,
  mode,
  color,
  onSelect,
  frontDoor = false,
  showPlatform = false,
}: {
  frontDoor?: boolean;
  showPlatform?: boolean;
  item: Item;
  index: number;
  items: Item[];
  progress: ReturnType<typeof timelineProgress>;
  mode?: string | null;
  color: string;
  onSelect: () => void;
}) {
  const c = useTheme();
  const [markerOffset, setMarkerOffset] = useState(28);
  const { width, fontScale } = useWindowDimensions();
  const { train, reflow, timeWidth } = tripTableLayout(width, fontScale, mode);
  const { t } = useTranslation();
  const { stop, time } = item;
  const first = index === 0;
  const last = index === items.length - 1;
  const canceled = time?.realtimeState === 'CANCELED' || time?.realtimeState === 'SKIPPED';
  const passed = !!time && (progress.nextIndex === -1 || index < progress.nextIndex);
  const current = index === progress.nextIndex;
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
      inset={6}
      color={color}
      markerOffset={markerOffset}
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
      <>
        <View
          style={{
            flex: 1,
            flexDirection: reflow ? 'column' : 'row',
            alignItems: reflow ? 'stretch' : 'center',
            paddingVertical: 6,
            minHeight: 44,
          }}
        >
          <View
            testID={`trip-stop-${index}`}
            onLayout={(event) => {
              const { y } = event.nativeEvent.layout;
              setMarkerOffset(y + (reflow ? 6 : 0) + 10 * fontScale);
            }}
            style={{
              flex: reflow ? undefined : 1,
              paddingHorizontal: 7,
              paddingVertical: reflow ? 6 : 0,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 5,
            }}
          >
            <TransitLabel
              html={stop.name || t('station')}
              placeName
              style={{
                flexShrink: 1,
                fontSize: 14,
                lineHeight: 20,
                includeFontPadding: false,
                textAlignVertical: 'bottom',
                fontFamily: current ? fonts.semibold : fonts.regular,
                color: canceled ? c.danger : passed ? c.muted : c.text,
                textDecorationLine: canceled ? 'line-through' : 'none',
              }}
            />
            {boarding && <FrontDoorBadge size={16} />}
          </View>
          {time && (
            <View
              style={{
                flexDirection: 'row',
                width: !train && !reflow ? timeWidth : undefined,
                flexWrap: 'wrap',
                alignItems: reflow ? 'center' : 'flex-end',
                justifyContent: 'flex-end',
                gap: reflow ? 12 : 0,
                paddingRight: 2,
                paddingBottom: reflow ? 6 : 0,
              }}
            >
              {train ? (
                (['arrival', 'departure'] as const).map((event) => {
                  const arrival = event === 'arrival';
                  const visible = arrival ? !first || last : !last || first;
                  return (
                    <View key={event} style={{ width: timeWidth, paddingHorizontal: 2, gap: 4 }}>
                      {reflow && (
                        <Text style={{ color: c.muted, fontSize: 12, textAlign: 'right' }}>
                          {t(event)}
                        </Text>
                      )}
                      {visible ? (
                        <ScheduleTime
                          compact
                          scheduled={arrival ? time.scheduledArrival : time.scheduledDeparture}
                          realtime={time.realtime
                            ? arrival ? time.realtimeArrival : time.realtimeDeparture
                            : undefined}
                          delay={arrival ? time.arrivalDelay : time.departureDelay}
                          canceled={canceled}
                        />
                      ) : (
                        <Text style={{ textAlign: 'right', color: c.muted, fontSize: 12 }}>-</Text>
                      )}
                    </View>
                  );
                })
            ) : (
              <ScheduleTime
                compact
                scheduled={time.scheduledDeparture ?? time.scheduledArrival}
                realtime={
                  time.realtime ? (time.realtimeDeparture ?? time.realtimeArrival) : undefined
                }
                delay={time.departureDelay ?? time.arrivalDelay}
                canceled={canceled}
              />
            )}
          </View>
        )}
      </View>
      {showPlatform && <PlatformCell value={platform} color={platformColor} />}
      </>
    </TimelineRow>
  );
}
