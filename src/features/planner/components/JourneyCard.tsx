import { View } from 'react-native';
import { ArrowRight, ChevronRight, Footprints } from 'lucide-react-native';
import { ListRow } from '~/components/ui/ListRow';
import { Text } from '~/components/ui/Text';
import { RouteBadge } from '~/components/ui/transit/RouteBadge';
import { ModeIcon } from '~/components/ui/transit/ModeIcon';
import { useTranslation } from '~/hooks/useTranslation';
import type { Journey } from '~/lib/transit/types/plan';
import { fonts, useTheme } from '~/lib/theme';
import { dayOffset, journeyDuration, journeyTime, journeyTransferLabel } from '../model/journey';

export function JourneyCard({
  journey,
  selected,
  fastest,
  onPress,
}: {
  journey: Journey;
  selected: boolean;
  fastest: boolean;
  onPress(): void;
}) {
  const { t } = useTranslation();
  const c = useTheme();
  const nextDay = dayOffset(journey.startTime, journey.endTime);
  const canceled = journey.legs.some((leg) => leg.canceled);
  return (
    <ListRow
      layout="content"
      onPress={onPress}
      accessibilityState={{ selected }}
      accessibilityLabel={`${journeyTime(journey.startTime)} - ${journeyTime(journey.endTime)}, ${journeyDuration(journey.duration, t)}, ${journeyTransferLabel(journey, t)}`}
      style={({ pressed }) => ({
        paddingVertical: 20,
        paddingHorizontal: 4,
        borderTopWidth: 1,
        borderColor: c.border,
        backgroundColor: pressed || selected ? c.surface : 'transparent',
        gap: 10,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Text style={{ fontFamily: fonts.mono, fontSize: 22, fontVariant: ['tabular-nums'] }}>
          {journeyTime(journey.startTime)}
        </Text>
        <ArrowRight size={15} color={c.muted} />
        <Text style={{ fontFamily: fonts.mono, fontSize: 22, fontVariant: ['tabular-nums'] }}>
          {journeyTime(journey.endTime)}
        </Text>
        {!!nextDay && <Text style={{ fontSize: 12, color: c.muted }}>+{nextDay}</Text>}
        <View style={{ flex: 1 }} />
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 15 }}>
            {journeyDuration(journey.duration, t)}
          </Text>
          {fastest && (
            <Text style={{ fontSize: 12, color: c.success }}>{t('planner_fastest')}</Text>
          )}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        {journey.legs.map((leg, index) => (
          <View key={leg.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {index > 0 && <ChevronRight size={11} color={c.muted} />}
            {leg.transit ? (
              <>
                <ModeIcon mode={leg.mode} size={14} color={c.secondary} />
                <RouteBadge
                  label={leg.routeName || leg.tripName}
                  mode={leg.mode}
                  color={leg.routeColor}
                  size="compact"
                />
              </>
            ) : (
              <>
                <Footprints size={14} color={c.muted} />
                <Text style={{ fontSize: 12, color: c.muted }}>
                  {journeyDuration(leg.duration, t)}
                </Text>
              </>
            )}
          </View>
        ))}
      </View>
      <View
        style={{ flexDirection: 'row', height: 4, gap: 3, borderRadius: 0, overflow: 'hidden' }}
      >
        {journey.legs.map((leg) => (
          <View
            key={leg.id}
            style={{
              flex: Math.max(leg.duration, 60),
              minWidth: 6,
              backgroundColor: leg.transit ? leg.routeColor : 'transparent',
              ...(!leg.transit
                ? ({ borderTopWidth: 2, borderStyle: 'dashed', borderColor: c.muted } as const)
                : {}),
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Text style={{ fontSize: 13, color: c.secondary }}>{journeyTransferLabel(journey, t)}</Text>
        {journey.walkTime > 0 && (
          <Text style={{ fontSize: 13, color: c.muted }}>
            {t('planner_walk_total', { duration: journeyDuration(journey.walkTime, t) })}
          </Text>
        )}
        <View style={{ flex: 1 }} />
        <ChevronRight size={15} color={c.accent} />
      </View>
      {canceled && <Text style={{ color: c.danger, fontSize: 13 }}>{t('planner_canceled')}</Text>}
      {journey.legs.some((leg) => leg.departureDelay >= 60) && (
        <Text style={{ color: c.warning, fontSize: 13 }}>{t('planner_delays')}</Text>
      )}
    </ListRow>
  );
}
