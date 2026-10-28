import { View } from 'react-native';
import { TimelineRow } from '~/components/panels/TimelineRow';
import { ScheduleTime } from '~/components/ui/transit/ScheduleTime';
import { useTripDetail } from '~/hooks/useTripDetail';
import { useTranslation } from '~/hooks/useTranslation';
import type { JourneyLeg } from '~/lib/transit/types/plan';
import { useMapStore } from '~/store/useMapStore';
import { intermediateTimes } from '../model/intermediate-times';
import { useJourneyTimelineLayout } from './journey-timeline-layout';

/** Mounted only for an expanded ride; shares the map's React Query entry, with no polling. */
export function JourneyIntermediateStops({ leg, color }: { leg: JourneyLeg; color: string }) {
  const trip = useTripDetail(leg.tripId ?? null, leg.serviceDate);
  const { timeWidth, stacked } = useJourneyTimelineLayout();
  const { t } = useTranslation();
  return intermediateTimes(leg, trip.data).map(({ stop, timing }, index) => {
    const live = timing?.realtime === true;
    const canceled = timing?.realtimeState === 'CANCELED' || timing?.realtimeState === 'SKIPPED';
    const time = (
      <View
        style={{
          width: stacked ? undefined : timeWidth,
          paddingRight: 10,
          justifyContent: 'center',
        }}
      >
        <ScheduleTime
          scheduled={timing?.scheduledArrival ?? timing?.scheduledDeparture}
          realtime={live ? (timing?.realtimeArrival ?? timing?.realtimeDeparture) : undefined}
          delay={live ? (timing?.arrivalDelay ?? timing?.departureDelay) : undefined}
          canceled={canceled}
        />
      </View>
    );
    return (
      <TimelineRow
        key={index}
        title={stop.name}
        color={color}
        mode={leg.mode}
        position="middle"
        appearance={{ tone: canceled ? 'canceled' : 'default', emphasis: 'normal' }}
        leading={!stacked ? time : undefined}
        trailing={stacked ? time : undefined}
        subtitle={
          canceled
            ? t('canceled')
            : timing
              ? t(live ? 'estimated' : 'scheduled')
              : trip.isError
                ? t('data_error')
                : undefined
        }
        disabled={stop.lat == null || stop.lon == null}
        onPress={() => {
          if (stop.lat != null && stop.lon != null)
            useMapStore.getState().flyTo([stop.lon, stop.lat], 15);
        }}
      />
    );
  });
}
