import { View } from 'react-native';
import { ArrowLeft, Footprints, Navigation, AlertTriangle } from 'lucide-react-native';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { useTranslation } from '~/hooks/useTranslation';
import { type, useTheme } from '~/lib/theme';
import type { Journey } from '~/lib/transit/types/plan';
import { usePlannerStore } from '~/store/usePlannerStore';
import { dayOffset, journeyDuration, journeyTime, journeyTransferLabel } from '../model/journey';
import { JourneyLegTimeline } from './JourneyLegTimeline';
import { JourneyTimelineStop } from './JourneyTimelineStop';

export function JourneyDetails({ journey }: { journey: Journey }) {
  const { t } = useTranslation();
  const c = useTheme();
  const last = journey.legs[journey.legs.length - 1];
  return (
    <View style={{ gap: 14 }}>
      <Button
        icon={ArrowLeft}
        label={t('planner_all_journeys')}
        variant="ghost"
        onPress={usePlannerStore.getState().showResults}
        style={{ alignSelf: 'flex-start' }}
      />
      <View style={{ gap: 8, paddingHorizontal: 3, paddingBottom: 16, borderBottomWidth: 1, borderColor: c.border }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>{t('departure')}</Text>
            <Text style={{ ...type.time, fontSize: 26, lineHeight: 32 }}>
              {journeyTime(journey.startTime)}
            </Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>{t('planner_arrival')}</Text>
            <Text style={{ ...type.time, fontSize: 26, lineHeight: 32 }}>
              {journeyTime(journey.endTime)}
              {dayOffset(journey.startTime, journey.endTime) > 0
                ? ` +${dayOffset(journey.startTime, journey.endTime)}`
                : ''}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 14, color: c.secondary }}>
          {journeyDuration(journey.duration, t)} · {journeyTransferLabel(journey, t)}
        </Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
          {journey.legs[0].from.name} → {last.to.name}
        </Text>
        <Button
          icon={Navigation}
          label={t('planner_show_journey')}
          onPress={usePlannerStore.getState().fitJourney}
          style={{ alignSelf: 'flex-start', marginTop: 3 }}
        />
      </View>
      {journey.trackClosure && (
        <View style={{ padding: 3, flexDirection: 'row', gap: 7, alignItems: 'flex-start' }}>
          <AlertTriangle size={15} color={c.warning} />
          <Text style={{ flex: 1, color: c.warning, fontSize: 13 }}>
            {t('planner_track_works')}
          </Text>
        </View>
      )}
      <View style={{ marginHorizontal: -10 }}>
        {journey.legs.map((leg, index) => (
          <JourneyLegTimeline
            key={leg.id}
            leg={leg}
            index={index}
            previous={journey.legs[index - 1]}
            next={journey.legs[index + 1]}
            startTime={journey.startTime}
          />
        ))}
        <JourneyTimelineStop
          leg={last}
          index={journey.legs.length - 1}
          startTime={journey.startTime}
          last
        />
      </View>
      {journey.walkTime > 0 && (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', padding: 4 }}>
          <Footprints size={15} color={c.muted} />
          <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
            {t('planner_walk_total', { duration: journeyDuration(journey.walkTime, t) })}
          </Text>
        </View>
      )}
      {journey.legs.some((leg) => leg.from.platform || leg.to.platform) && (
        <Text style={{ color: c.secondary, fontSize: 14, lineHeight: 20 }}>{t('planner_platform_note')}</Text>
      )}
    </View>
  );
}
