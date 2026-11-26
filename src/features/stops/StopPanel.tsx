import { useTranslation } from '@/hooks/useTranslation';
import { useMapStore } from '@/store/useMapStore';
import { stopTimeKey } from '@/lib/transit/stop-times';
import { ArrowLeft, RefreshCw, Route } from 'lucide-react-native';
import { View } from 'react-native';
import { usePanelDimensions } from '~/components/panels/PanelLayout';
import { BOARD_TABLE, stopBoardTableLayout } from '~/lib/transit-table';
import { PanelHeader } from '~/components/panels/PanelHeader';
import { Button } from '~/components/ui/Button';
import { QueryError } from '~/components/ui/QueryError';
import { QueryList } from '~/components/ui/QueryList';
import { TableHeader } from '~/components/ui/TableHeader';
import { Tabs } from '~/components/ui/Tabs';
import { BoardDateToolbar } from '~/features/stops/components/BoardDateToolbar';
import { DepartureRow } from '~/features/stops/components/DepartureRow';
import { StopRouteControls } from '~/features/stops/components/StopRouteControls';
import { TimetableHour, TimetableLegend } from '~/features/stops/components/TimetableGrid';
import { departurePresentation } from './model/departure-presentation';
import { BOARD_RANGES, useStopBoard } from '~/features/stops/hooks/useStopBoard';
import { controls, useTheme } from '~/lib/theme';

const boardActionStyle = {
  width: controls.compact, height: controls.compact, minWidth: controls.compact, minHeight: controls.compact, paddingVertical: 0,
} as const;

export function StopPanel() {
  const {
    fullTimetable,
    showFullTimetable,
    backToVehicle,
    selected,
    showConnections,
    now,
    day,
    today,
    query,
    routeRequests,
    connections,
    rail,
    activeTab,
    direction,
    visible,
    showPlatforms,
    hours,
    routes,
    select,
    changeTab,
    changeDay,
    clock,
    dateLabel,
    offset,
    time,
    range,
    setRange,
    changeTime,
    resetTime,
  } = useStopBoard();
  const { t } = useTranslation();
  const c = useTheme();
  const { width, fontScale } = usePanelDimensions();
  const table = stopBoardTableLayout(width, fontScale);
  const nextIndex = visible.findIndex((dep) => {
    const item = departurePresentation(dep, now, direction);
    return !item.canceled && item.minutes != null && item.minutes >= 0;
  });
  const panelHeader = <PanelHeader variant="compact" title={query.data?.name || t('station')}
    actions={backToVehicle && <Button variant="ghost" icon={ArrowLeft}
      label={t('back_to_vehicle')} onPress={backToVehicle} />} />;
  const tabs = (
    <Tabs
      edgeToEdge
      label={t('stop_board')}
      value={activeTab}
      options={(rail
        ? (['departures', 'arrivals', 'timetable'] as const)
        : (['departures', 'timetable'] as const)
      ).map((value) => ({ value, label: t(value === 'departures' && !rail ? 'stop_events' : value) }))}
      onChange={changeTab}
    />
  );
  const boardTools = (
    <View>
      {showFullTimetable && activeTab !== 'timetable' && <Button label={t('full_timetable')} onPress={fullTimetable} />}
      <BoardDateToolbar
        now={now}
        offset={offset}
        date={day.date}
        dateLabel={dateLabel}
        time={time}
        currentTime={clock}
        onDay={changeDay}
        onTime={changeTime}
        onReset={resetTime}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 10, gap: 6, borderBottomWidth: 1, borderColor: c.border }}>
        <View style={{ flex: 1 }}>
          <StopRouteControls options={routes} loading={query.isPending || routeRequests > 0} />
        </View>
        <Button
          variant="surface"
          size="icon"
          icon={RefreshCw}
          iconSize={14}
          style={boardActionStyle}
          hitSlop={3}
          label={t('refresh')}
          loading={query.isFetching}
          onPress={() => { void query.refetch(); }}
        />
        <Button
          variant="surface"
          size="icon"
          icon={Route}
          iconSize={14}
          style={boardActionStyle}
          hitSlop={3}
          label={t('show_stop_routes')}
          selected={showConnections}
          accessibilityState={{ selected: showConnections, busy: connections.isPending }}
          onPress={() => useMapStore.getState().setShowStopConnections(!showConnections)}
        />
      </View>
      {showPlatforms && activeTab !== 'timetable' && (
        <TableHeader
          size="compact"
          style={{ gap: BOARD_TABLE.gap, paddingLeft: BOARD_TABLE.paddingLeft, paddingRight: BOARD_TABLE.paddingRight }}
          columns={[
            { key: 'route', label: table.reflow ? `${t('route')} · ${t(rail ? direction : 'time')}` : t('route') },
            ...(!table.reflow ? [{ key: 'time', label: t(rail ? direction : 'time'), width: table.timeWidth, align: 'right' as const }] : []),
            { key: 'platform', label: t('platform_short'), accessibilityLabel: t('platform'), width: table.platformWidth, align: 'center' },
          ]}
        />
      )}
      {showConnections && connections.isError && (
        <QueryError
          retry={() => { void connections.refetch(); }}
          stale={!!connections.data}
        />
      )}
    </View>
  );
  return (
    <View style={{ flex: 1 }}>
      {panelHeader}
      {tabs}
      {boardTools}
      {activeTab !== 'timetable' ? (
        <QueryList
          query={query}
          pullToRefresh={false}
          bounces={false}
          overScrollMode="never"
          style={{ flex: 1 }}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          key={direction}
          testID={`stop-${direction}`}
          data={visible}
          keyExtractor={(dep) => `${dep.routeId}|${stopTimeKey(dep)}`}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={16}
          alerts={query.data?.alerts}
          emptyMessage={t(
            query.data
              ? !rail
                ? today ? 'no_stop_events_range' : 'no_stop_events_day'
                : direction === 'arrivals'
                ? today
                  ? 'no_arrivals_range'
                  : 'no_arrivals_day'
                : today
                  ? 'no_departures_range'
                  : 'no_departures_day'
              : 'no_stop_detail',
          )}
          renderItem={({ item, index }) => (
            <DepartureRow
              next={index === nextIndex}
              showPlatform={showPlatforms}
              direction={direction}
              departure={item}
              now={now}
              onPress={() => select(item)}
            />
          )}
          ListFooterComponent={
            (today || time !== null) &&
            range < BOARD_RANGES.length - 1 &&
            !!query.data &&
            !query.isPending ? (
              <Button
                label={t('show_next', { hours: BOARD_RANGES[range + 1] })}
                onPress={() => setRange((v) => v + 1)}
                style={{ margin: 8 }}
              />
            ) : (
              <View style={{ height: 10 }} />
            )
          }
        />
      ) : (
        <QueryList
          query={query}
          pullToRefresh={false}
          bounces={false}
          overScrollMode="never"
          style={{ flex: 1 }}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          key="timetable"
          loadingVariant="timetable"
          testID="stop-timetable"
          data={hours}
          keyExtractor={(row) => String(row.hour)}
          alerts={query.data?.alerts}
          header={<TimetableLegend departures={visible} />}
          emptyMessage={t(
            query.data
              ? selected?.length === 0 && routes.length > 0
                ? 'select_timetable_routes'
                : 'no_departures_day'
              : 'no_stop_detail',
          )}
          renderItem={({ item }) => <TimetableHour row={item} now={now} onSelect={select} />}
        />
      )}
    </View>
  );
}
