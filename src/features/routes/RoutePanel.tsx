import { useTransitPrefetch } from '~/hooks/useTransitPrefetch';
import { selectedRoutePattern } from '@/lib/transit/route-pattern';
import { useRouteDetail } from '@/hooks/useRouteDetail';
import { useRouteTimetable } from '@/hooks/useRouteTimetable';
import { useTranslation } from '@/hooks/useTranslation';
import { validCoordinates } from '@/lib/transit';
import { getRouteColor } from '@/lib/transit/colors';
import { isBkkRoute } from '@/lib/transit/agency';
import { formatDuration } from '@/lib/transit/time/format';
import { useMapStore } from '@/store/useMapStore';
import { Platform, View, useWindowDimensions } from 'react-native';
import { platformColumnWidth } from '~/lib/transit-table';
import { PlatformCell } from '~/components/ui/transit/PlatformCell';
import { TableHeader } from '~/components/ui/TableHeader';
import { PanelHeader } from '~/components/panels/PanelHeader';
import { timelinePosition } from '~/components/panels/timeline-types';
import { TimelineRow } from '~/components/panels/TimelineRow';
import { Disclosure } from '~/components/ui/Disclosure';
import { Button } from '~/components/ui/Button';
import { QueryList } from '~/components/ui/QueryList';
import { Section } from '~/components/ui/Section';
import { Select } from '~/components/ui/Select';
import { Text } from '~/components/ui/Text';
import { TransitLabel } from '~/components/ui/transit/TransitLabel';
import { routeDirectionDetails } from '~/features/routes/model/route-direction';
import { BoardingAction } from '~/features/tickets/components/BoardingAction';
import { useTheme } from '~/lib/theme';

export function RoutePanel() {
  const prefetch = useTransitPrefetch();
  const id = useMapStore((s) => s.selectedRouteId);
  const patternId = useMapStore((s) => s.selectedPatternId);
  const query = useRouteDetail(id);
  const route = query.data;
  const pattern = selectedRoutePattern(route, patternId);
  const timetable = useRouteTimetable(id, pattern);
  const c = useTheme();
  const { fontScale } = useWindowDimensions();
  const showPlatforms = !!pattern?.stops?.some((stop) => stop.platformCode?.trim());
  const { t } = useTranslation();
  const color = getRouteColor(route?.mode, route?.color, route?.textColor).primary;
  const durationLabel =
    timetable.data?.totalMinutes != null ? formatDuration(timetable.data.totalMinutes, t) : null;
  return (
    <View style={{ flex: 1 }}>
      <PanelHeader
        bkk={isBkkRoute(route)}
        title={(pattern?.reference ? routeDirectionDetails(pattern).title : undefined) || pattern?.headsign || pattern?.stops?.at(-1)?.name || route?.longName || t('route')}
        subtitle={[pattern?.loopVia ? t('loop_route') : '', route?.agency?.name].filter(Boolean).join(' · ')}
        routeLabel={route?.shortName}
        mode={route?.mode}
        color={color}
        actions={Platform.OS !== 'web' ? <BoardingAction route={route} /> : undefined}
      />
      <QueryList
        loadingVariant="timeline"
        query={query}
        testID="route-stops"
        data={pattern?.stops ?? []}
        keyExtractor={(stop, i) => `${stop.id}-${i}`}
        alerts={route?.alerts}
        header={
          <>
            {route && (route.patterns?.length ?? 0) > 1 && (
              <>
                <Section title={t('route_directions')} />
                <View style={{ paddingHorizontal: 10, paddingBottom: 6 }}>
                  <Select
                    label={t('select_direction')}
                    value={pattern?.id || ''}
                    options={(route.patterns ?? []).map((p) => {
                      const details = routeDirectionDetails(p);
                      return {
                        value: p.id || '',
                        label: details.title || t('route'),
                        description: [
                          details.count > 0 && t('route_stop_count', { count: details.count }),
                          details.codes.length > 0 &&
                            t('route_trip_codes', { codes: details.codes.join(', ') }),
                        ]
                          .filter(Boolean)
                          .join('\n'),
                      };
                    })}
                    onChange={useMapStore.getState().setSelectedPatternId}
                  />
                </View>
              </>
            )}
            {route && (
              <Disclosure title={t('planner_ride_details')}>
                <View style={{ padding: 10, gap: 6, backgroundColor: c.surface }}>
                  {!!pattern?.stops?.length && (
                    <View style={{ gap: 3 }}>
                      <Text style={{ color: c.secondary, fontSize: 14, lineHeight: 20 }}>
                        {t('route_from')}{' '}
                        <TransitLabel
                          html={pattern.stops[0].name || pattern.fromStopName || '?'}
                          placeName
                          style={{ fontSize: 14, color: c.text }}
                        />
                      </Text>
                      <Text style={{ color: c.secondary, fontSize: 14, lineHeight: 20 }}>
                        {t('route_to')}{' '}
                        <TransitLabel
                          html={pattern.stops.at(-1)?.name || pattern.headsign || '?'}
                          placeName
                          style={{ fontSize: 14, color: c.text }}
                        />
                      </Text>
                    </View>
                  )}
                  {!!route.desc && (
                    <TransitLabel html={route.desc} style={{ color: c.secondary, fontSize: 14, lineHeight: 20 }} />
                  )}
                  <Text style={{ fontSize: 14, color: c.secondary }}>
                    {t('route_stop_count', { count: pattern?.stops?.length ?? 0 })}
                    {durationLabel ? ` · ${t('route_duration', { duration: durationLabel })}` : ''}
                  </Text>
                  <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
                    {t(
                      timetable.isFetching && !timetable.data
                        ? 'route_timing_loading'
                        : timetable.data?.totalMinutes != null
                          ? 'route_timing_note'
                          : pattern?.reference ? 'reference_timing_note' : 'route_timing_unavailable',
                    )}
                  </Text>
                  {timetable.isError && (
                    <Button
                      label={t('retry')}
                      onPress={() => {
                        void timetable.refetch();
                      }}
                    />
                  )}
                </View>
              </Disclosure>
            )}
            {showPlatforms && <TableHeader size="compact" style={{ paddingLeft: 41 }} columns={[
              { key: 'station', label: t('station') },
              { key: 'platform', label: t('platform_short'), accessibilityLabel: t('platform'), width: platformColumnWidth(fontScale), align: 'center' },
            ]} />}
          </>
        }
        emptyMessage={t(route ? 'no_route_stops' : 'no_route_detail')}
        renderItem={({ item: stop, index }) => {
          const elapsed = timetable.data?.rows[index]?.elapsedMinutes;
          const segment = timetable.data?.rows[index + 1]?.segmentMinutes;
          const stopId = stop.gtfsId || stop.id;
          return (
            <TimelineRow
              endColumn={showPlatforms ? <PlatformCell value={stop.platformCode} /> : undefined}
              title={stop.name}
              color={color}
              position={timelinePosition(index, pattern?.stops?.length ?? 0)}
              disabled={!stopId}
              onIntent={() => { if (stopId) prefetch({ kind: 'stop', id: stopId }); }}
              subtitle={segment != null ? t('segment_duration', { duration: formatDuration(segment, t) }) : undefined}
              trailing={
                elapsed != null ? (
                  <Text style={{ fontSize: 14, lineHeight: 20, color: c.secondary }}>
                    {t('elapsed_duration', { duration: formatDuration(elapsed, t) })}
                  </Text>
                ) : undefined
              }
              onPress={() => {
                if (stopId) {
                  useMapStore.getState().setSelectedStopId(stopId);
                  if (validCoordinates(stop.lon, stop.lat))
                    useMapStore.getState().flyTo([stop.lon!, stop.lat!], 15);
                }
              }}
            />
          );
        }}
        ListFooterComponent={<View style={{ height: 10 }} />}
      />
    </View>
  );
}
