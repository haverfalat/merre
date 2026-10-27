import { View } from 'react-native';
import { TimelineRow } from '~/components/panels/TimelineRow';
import { Text } from '~/components/ui/Text';
import { ScheduleTime } from '~/components/ui/transit/ScheduleTime';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { useTranslation } from '~/hooks/useTranslation';
import { fonts, useTheme } from '~/lib/theme';
import type { JourneyLeg } from '~/lib/transit/types/plan';
import { usePlannerStore } from '~/store/usePlannerStore';
import { dayOffset, journeyTime } from '../model/journey';

function seconds(epoch: number) {
  const [hours, minutes] = journeyTime(epoch).split(':').map(Number);
  return hours * 3600 + minutes * 60;
}
export function JourneyTimelineStop({
  leg,
  previous,
  index,
  startTime,
  last = false,
}: {
  leg: JourneyLeg;
  previous?: JourneyLeg;
  index: number;
  startTime: number;
  last?: boolean;
}) {
  const { t } = useTranslation();
  const c = useTheme();
  const point = last ? leg.to : leg.from;
  const time = last ? leg.endTime : leg.startTime;
  const delay = last ? leg.arrivalDelay : leg.departureDelay;
  const color = leg.transit ? leg.routeColor! : c.muted;
  const offset = dayOffset(startTime, time);
  const platform = point.platform || (!last && previous?.to.platform);
  return (
    <TimelineRow
      color={color}
      mode={leg.mode}
      dashed={!leg.transit}
      previousColor={previous ? (previous.transit ? previous.routeColor : c.muted) : color}
      previousDashed={previous ? !previous.transit : !leg.transit}
      position={last ? 'last' : index === 0 ? 'first' : 'middle'}
      appearance={{ tone: leg.canceled ? 'canceled' : 'default', emphasis: 'strong' }}
      onPress={() => usePlannerStore.getState().focusLeg(index)}
      trailing={
        <View style={{ minWidth: 47, paddingVertical: 8, alignItems: 'flex-end', gap: 3 }}>
          <ScheduleTime
            scheduled={seconds(time - delay * 1000)}
            realtime={seconds(time)}
            delay={delay}
            canceled={leg.canceled}
          />
          {!last && previous && Math.abs(previous.endTime - time) >= 60000 && (
            <Text style={{ fontSize: 9, color: c.muted }}>
              {t('planner_arrived_at', { time: journeyTime(previous.endTime) })}
            </Text>
          )}
          {!!offset && <Text style={{ fontSize: 9, color: c.muted }}>+{offset}</Text>}
        </View>
      }
    >
      <View style={{ flex: 1, paddingHorizontal: 7, paddingVertical: 10, gap: 3 }}>
        <TransitLabel
          html={point.name}
          placeName
          style={{ fontFamily: fonts.semibold, fontSize: 13 }}
        />
        {!!platform && (
          <Text style={{ fontSize: 10, color: c.accent }}>
            {t(
              leg.mode === 'BUS' || leg.mode === 'COACH' || previous?.mode === 'COACH'
                ? 'planner_bay'
                : 'planner_platform',
              { platform },
            )}
          </Text>
        )}
        {last && <Text style={{ fontSize: 10, color: c.muted }}>{t('planner_arrival')}</Text>}
      </View>
    </TimelineRow>
  );
}
