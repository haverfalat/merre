import { useTranslation } from '@/hooks/useTranslation';
import { useMapStore } from '@/store/useMapStore';
import { Route } from 'lucide-react-native';
import { View } from 'react-native';
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
import { BOARD_RANGES, useStopBoard } from '~/features/stops/hooks/useStopBoard';

export function StopPanel() {
  const {
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
  const panelHeader = (
    <PanelHeader
      variant="compact"
      title={query.data?.name || t('station')}
      headerActions={
        <Button
          size="icon"
          icon={Route}
          label={t('show_stop_routes')}
          selected={showConnections}
          accessibilityState={{ selected: showConnections, busy: connections.isPending }}
          onPress={() => useMapStore.getState().setShowStopConnections(!showConnections)}
        />
      }
    />
  );
  const tabs = (
    <Tabs
      label={t('stop_board')}
      value={activeTab}
      options={(rail
        ? (['departures', 'arrivals', 'timetable'] as const)
        : (['departures', 'timetable'] as const)
      ).map((value) => ({ value, label: t(value) }))}
      onChange={changeTab}
    />
  );
  return (
    <View style={{ flex: 1 }}>
      {panelHeader}
      {tabs}
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
      <StopRouteControls options={routes} loading={query.isPending || routeRequests > 0} />
      {showPlatforms && activeTab !== 'timetable' && (
        <TableHeader
          size="compact"
          style={{ gap: 8 }}
          columns={[
            { key: 'route', label: t('route') },
            { key: 'time', label: t(direction), width: 88, align: 'right' },
            { key: 'platform', label: t('platform_short'), width: 30, align: 'center' },
          ]}
        />
      )}
      {showConnections && connections.isError && (
        <QueryError
          retry={() => {
            void connections.refetch();
          }}
          stale={!!connections.data}
        />
      )}
      {activeTab !== 'timetable' ? (
        <QueryList
          query={query}
          key={direction}
          testID={`stop-${direction}`}
          data={visible}
          keyExtractor={(dep, i) =>
            `${dep.trip?.gtfsId}|${dep.serviceDay}|${direction === 'arrivals' ? dep.scheduledArrival : dep.scheduledDeparture}|${dep.stop?.id}|${i}`
          }
          keyboardShouldPersistTaps="handled"
          initialNumToRender={16}
          alerts={query.data?.alerts}
          emptyMessage={t(
            query.data
              ? direction === 'arrivals'
                ? today
                  ? 'no_arrivals_range'
                  : 'no_arrivals_day'
                : today
                  ? 'no_departures_range'
                  : 'no_departures_day'
              : 'no_stop_detail',
          )}
          renderItem={({ item }) => (
            <DepartureRow
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
          key="timetable"
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
