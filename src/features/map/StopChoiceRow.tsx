import { Check } from 'lucide-react-native';
import { View } from 'react-native';
import { ListRow } from '~/components/ui/ListRow';
import { Text } from '~/components/ui/Text';
import { Skeleton } from '~/components/ui/Skeleton';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { useStopDetail } from '~/hooks/useStopDetail';
import { useStopRoutes } from '~/hooks/useStopRoutes';
import { useTranslation } from '~/hooks/useTranslation';
import { stopBoardRows } from '~/features/stops/model/station-board-model';
import { stopRouteOptions } from '~/features/stops/model/stop-route-filters';
import { cleanTransitPlaceName, cleanTransitLabel } from '~/lib/transit/labels';
import { controls, fonts, useTheme } from '~/lib/theme';
import { type StopPreview } from '~/store/useStopPreview';

/** Identify a boarding place by its actual services, rather than a backend ID. */
export function StopChoiceRow({ stop, selected, onSelect }: { stop: StopPreview; selected: boolean; onSelect: () => void }) {
  const query = useStopDetail(stop.id);
  const routesQuery = useStopRoutes(stop.id);
  const { t } = useTranslation();
  const c = useTheme();
  const departures = stopBoardRows(query.data, 'departures');
  const directions = [...new Map(departures.map(departure => [
    `${departure.mode}|${cleanTransitLabel(departure.routeLabel)}|${cleanTransitPlaceName(departure.headsign)}`,
    departure,
  ])).values()];
  const served = new Set(directions.map(departure => departure.routeId));
  const otherRoutes = stopRouteOptions([], routesQuery.data?.routes).filter(route => !served.has(route.id));
  const platform = query.data?.platformCode || routesQuery.data?.platformCode;
  const loading = query.isPending || routesQuery.isPending;
  return (
    <ListRow layout="content" accessibilityState={{ selected }}
      onPress={onSelect}
      style={({ pressed }) => ({ minHeight: controls.target, padding: 10, gap: 6,
        backgroundColor: pressed || selected ? c.raised : 'transparent',
        borderBottomWidth: 1, borderColor: c.border })}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <TransitLabel html={query.data?.name || stop.name} placeName
          style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 }} />
        {selected && <Check size={18} color={c.text} />}
      </View>
      {loading && !directions.length && !otherRoutes.length ? <Skeleton height={18} width="80%" /> :
        <Text numberOfLines={2} style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
          {[
            platform ? t('planner_platform', { platform }) : '',
            ...directions.map(departure => `${cleanTransitLabel(departure.routeLabel)} → ${cleanTransitPlaceName(departure.headsign)}`),
            otherRoutes.map(route => cleanTransitLabel(route.label)).join(', '),
          ].filter(Boolean).join(' · ') || t(query.isError ? 'no_stop_detail' : 'no_departures_range')}
        </Text>}

    </ListRow>
  );
}
