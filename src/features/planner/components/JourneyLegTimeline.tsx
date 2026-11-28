import { useState } from 'react';
import { View } from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  MapPin,
  Navigation,
  AlertTriangle,
} from 'lucide-react-native';
import { TimelineTrack } from '~/components/panels/TimelineTrack';
import { Disclosure } from '~/components/ui/Disclosure';
import { Button } from '~/components/ui/Button';
import { Text } from '~/components/ui/Text';
import { RouteBadge } from '~/components/ui/transit/RouteBadge';
import { ModeIcon } from '~/components/ui/transit/ModeIcon';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { TripAmenities } from '~/features/trips/components/TripAmenities';
import { useTranslation } from '~/hooks/useTranslation';
import { getMapRouteColor } from '~/lib/transit/colors';
import type { JourneyLeg } from '~/lib/transit/types/plan';
import { fonts, useTheme } from '~/lib/theme';
import { usePlannerStore } from '~/store/usePlannerStore';
import { useUIStore } from '~/store/useUIStore';
import { journeyDuration } from '../model/journey';
import { JourneyIntermediateStops } from './JourneyIntermediateStops';
import { JourneyTimelineStop } from './JourneyTimelineStop';
import { WalkingDirections } from './WalkingDirections';
import { useJourneyTimelineLayout } from './journey-timeline-layout';

export function JourneyLegTimeline({
  leg,
  previous,
  next,
  index,
  startTime,
}: {
  leg: JourneyLeg;
  previous?: JourneyLeg;
  next?: JourneyLeg;
  index: number;
  startTime: number;
}) {
  const expanded = usePlannerStore((state) => state.expandedLegs.includes(index));
  const [showNotices, setShowNotices] = useState(false);
  const { t } = useTranslation();
  const c = useTheme();
  const { timeWidth } = useJourneyTimelineLayout();
  const theme = useUIStore((state) => state.theme);
  const focused = usePlannerStore((state) => state.focusedLeg === index);
  const color = leg.transit ? getMapRouteColor(leg.mode, leg.routeColor, theme) : c.muted;
  const wait = next ? Math.max(0, next.startTime - leg.endTime) / 1000 : 0;
  const expandable = leg.transit ? leg.intermediateStops.length > 0 : (leg.steps?.length || 0) > 0;
  return (
    <View>
      <JourneyTimelineStop leg={leg} previous={previous} index={index} startTime={startTime} />
      <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
        <View style={{ width: timeWidth }} />
        <TimelineTrack
          color={color}
          position="middle"
          tone={leg.canceled ? 'canceled' : 'default'}
          dashed={!leg.transit}
          marker={false}
        />
        <View style={{ flex: 1, paddingLeft: 7, paddingTop: 4, paddingBottom: 12, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <ModeIcon mode={leg.mode} size={18} color={color} />
            {leg.transit ? (
              <RouteBadge
                label={leg.routeName || leg.tripName}
                mode={leg.mode}
                color={leg.routeColor}
              />
            ) : (
              <Text style={{ flexShrink: 1, fontSize: 15, fontFamily: fonts.semibold }}>
                {t('planner_walk_distance', { distance: Math.round(leg.distance) })}
              </Text>
            )}
            <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>{journeyDuration(leg.duration, t)}</Text>
          </View>
          {leg.transit && (
            <View style={{ gap: 3 }}>
              {!!leg.tripName && (
                <Text style={{ fontSize: 14, fontFamily: fonts.medium }}>{leg.tripName}</Text>
              )}
              {!!leg.headsign && (
                <TransitLabel
                  html={t('planner_towards', { name: leg.headsign })}
                  placeName
                  style={{ fontSize: 14, color: c.secondary }}
                />
              )}
            </View>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {expandable && (
              <Button
                variant="surface"
                size="small"
                icon={expanded ? ChevronUp : ChevronDown}
                label={
                  leg.transit
                    ? t('planner_ride_stops', {
                        duration: journeyDuration(leg.duration, t),
                        count: leg.intermediateStops.length,
                      })
                    : t('planner_walking_directions')
                }
                accessibilityState={{ expanded }}
                onPress={() => usePlannerStore.getState().toggleStops(index)}
              />
            )}
            <Button
              icon={MapPin}
              label={t('planner_show_leg')}
              size="small"
              variant="surface"
              selected={focused}
              onPress={() => usePlannerStore.getState().focusLeg(index)}
            />
          </View>
          {expanded && !leg.transit && <WalkingDirections steps={leg.steps} />}
          {(!!leg.services?.length || !!leg.operator) && (
            <Disclosure title={t('planner_ride_details')}>
              <View style={{ gap: 8, paddingVertical: 8 }}>
                {!!leg.operator && (
                  <Text style={{ color: c.secondary, fontSize: 14, lineHeight: 20 }}>
                    {t('planner_operator', { name: leg.operator })}
                  </Text>
                )}
                <TripAmenities services={leg.services} showNames />
              </View>
            </Disclosure>
          )}
          {!!leg.notices.length && (
            <>
              <Button
                icon={AlertTriangle}
                label={t('planner_alerts', { count: leg.notices.length })}
                variant="text"
                textColor={c.warning}
                style={{ alignSelf: 'flex-start' }}
                accessibilityState={{ expanded: showNotices }}
                onPress={() => setShowNotices(!showNotices)}
              />
              {showNotices &&
                leg.notices.map((notice) => (
                  <Text key={notice} style={{ fontSize: 13, color: c.warning }}>
                    {notice}
                  </Text>
                ))}
            </>
          )}
          {leg.transit && leg.tripId && (
            <Button
              icon={Info}
              label={t('planner_service_details')}
              variant="surface"
              size="small"
              style={{ alignSelf: 'flex-start' }}
              onPress={() => usePlannerStore.getState().openService(leg.tripId!, leg.serviceDate)}
            />
          )}
          {leg.canceled && (
            <Text style={{ fontSize: 13, color: c.danger }}>{t('planner_canceled')}</Text>
          )}
          {leg.realtime && (
            <Text style={{ fontSize: 14, lineHeight: 20, color: c.success }}>{t('planner_realtime')}</Text>
          )}
          {leg.coordinates.length < 2 && (
            <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
              {t('planner_approximate_geometry')}
            </Text>
          )}
        </View>
      </View>
      {expanded && leg.transit && <JourneyIntermediateStops leg={leg} color={color} />}
      {(wait >= 60 || next?.staySeated) && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
          <View style={{ width: timeWidth }} />
          <TimelineTrack color={c.muted} dashed marker={false} position="middle" tone="default" />
          <View
            style={{
              flex: 1,
              paddingLeft: 7,
              paddingVertical: 9,
              flexDirection: 'row',
              gap: 6,
              alignItems: 'center',
            }}
          >
            {next?.staySeated ? (
              <Navigation size={13} color={c.success} />
            ) : (
              <Clock size={13} color={c.muted} />
            )}
            <Text style={{ fontSize: 14, lineHeight: 20, color: next?.staySeated ? c.success : c.secondary }}>
              {next?.staySeated
                ? t('planner_stay_seated')
                : t('planner_wait', { duration: journeyDuration(wait, t) })}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
