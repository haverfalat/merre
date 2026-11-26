import { useNow } from '@/hooks/useNow';
import { useStopConnections } from '@/hooks/useStopConnections';
import { useStopDetail } from '@/hooks/useStopDetail';
import { useStopRoutes } from '@/hooks/useStopRoutes';
import { useTranslation } from '@/hooks/useTranslation';
import type { Departure } from '@/lib/stop-departures';
import { serviceDate, serviceDayBounds, TRANSIT_TIME_ZONE } from '@/lib/transit';
import { isRailMode } from '@/lib/transit/modes';
import { formatServiceTime } from '@/lib/transit/time/format';
import { useMapStore } from '@/store/useMapStore';
import { useIsFetching } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { boardDateOffset, boardTimeEpoch } from '~/features/stops/model/board-date';
import { timetableHours } from '~/features/stops/model/timetable';
import { useStopPreview } from '~/store/useStopPreview';

import {
  boardTiming,
  hasRailBoard,
  stopBoardRows,
  type BoardDirection,
} from '~/features/stops/model/station-board-model';
import { getStopBoardView, rememberStopBoardView } from '~/features/stops/model/stop-board-history';
import { stopRouteOptions } from '~/features/stops/model/stop-route-filters';

export const BOARD_RANGES = [3, 6, 12, 24];

export function useStopBoard() {
  const id = useMapStore((s) => s.selectedStopId);
  const selected = useMapStore((s) => s.stopRouteFilter);
  const [initial] = useState(() => {
    const saved = id ? getStopBoardView(id) : undefined;
    const request = useStopPreview.getState().board;
    return {
      id,
      saved: request?.id === id && (request.at != null || request.routeFilter !== undefined) ? undefined : saved,
      at: request?.id === id ? request.at : undefined,
      fromVehicle: request?.id === id && request.fromVehicle === true,
      vehicle: request?.id === id ? request.vehicle : undefined,
      routeFilter: request?.id === id ? request.routeFilter : undefined,
      tab: request?.id === id ? request.tab : (saved?.tab ?? ('departures' as const)),
    };
  });
  const timetableRoutes = useRef<string[] | null>(
    initial.saved ? initial.saved.timetableRoutes : [],
  );
  const departureRoutes = useRef<string[] | null>(
    initial.routeFilter !== undefined
      ? initial.routeFilter
      : initial.saved
        ? initial.saved.departureRoutes
        : selected,
  );
  const showConnections = useMapStore((s) => s.showStopConnections);
  const [tab, setTab] = useState<'departures' | 'arrivals' | 'timetable'>(initial.tab);
  const [date, setDate] = useState<string | null>(initial.at != null ? serviceDate(initial.at * 1000) : initial.saved?.date ?? null);
  const [range, setRange] = useState(initial.saved?.range ?? 0);
  const [time, setTime] = useState<string | null>(initial.at != null ? formatServiceTime(initial.at * 1000) : initial.saved?.time ?? null);
  useLayoutEffect(() => {
    if (!initial.id || useMapStore.getState().selectedStopId !== initial.id) return;
    if (useStopPreview.getState().board?.id === initial.id) useStopPreview.setState({ board: null });
    useMapStore
      .getState()
      .setStopRouteFilter(
        initial.tab === 'timetable' ? timetableRoutes.current : departureRoutes.current,
      );
    if (initial.saved) useMapStore.getState().setShowStopConnections(initial.saved.showConnections);
  }, [initial]);
  const [arrivalCutoff, setArrivalCutoff] = useState(initial.at);
  const [showFullTimetable, setShowFullTimetable] = useState(initial.fromVehicle);
  const now = useNow();
  const offset = date ? boardDateOffset(date, now) : 0;
  const day = serviceDayBounds(now, offset);
  const today = offset === 0;
  const query = useStopDetail(id, {
    timetable: tab === 'timetable',
    startTime: today && time === null && tab !== 'timetable' ? undefined : day.start,
    timeRange: today && time === null && tab !== 'timetable' ? 86400 : day.end - day.start,
  });
  const routeRequests = useIsFetching({ queryKey: ['stop-routes'] });
  const stopRoutes = useStopRoutes(id);
  const { t, language } = useTranslation();
  const connections = useStopConnections(id, showConnections);
  const rail =
    hasRailBoard(query.data) || !!stopRoutes.data?.routes.some((route) => isRailMode(route.mode));
  const activeTab = tab === 'arrivals' && !rail ? 'departures' : tab;
  const direction: BoardDirection = activeTab === 'arrivals' ? 'arrivals' : 'departures';
  const unknownOrigin = t('unknown_origin');
  const departures = useMemo(
    () => stopBoardRows(query.data, rail || activeTab === 'timetable' ? 'departures' : 'combined', unknownOrigin),
    [query.data, rail, activeTab, unknownOrigin],
  );
  const arrivals = useMemo(
    () => stopBoardRows(query.data, 'arrivals', unknownOrigin),
    [query.data, unknownOrigin],
  );
  const rows = direction === 'arrivals' ? arrivals : departures;
  const start =
    time && activeTab !== 'timetable'
      ? arrivalCutoff ?? boardTimeEpoch(day.date, time)
      : today && activeTab !== 'timetable'
        ? now / 1000
        : day.start;
  const end =
    activeTab !== 'timetable' && (today || time !== null)
      ? start + BOARD_RANGES[range] * 3600
      : day.end;
  const visible = rows.filter((row) => {
    const epoch = boardTiming(row, direction).epoch!;
    return epoch >= start && epoch < end && (selected === null || selected.includes(row.routeId));
  });
  const showPlatforms = visible.some((row) => !!String(row.stop?.platformCode ?? '').trim());
  const hours = timetableHours(visible);
  const routes = useMemo(
    () => stopRouteOptions([...arrivals, ...departures], stopRoutes.data?.routes),
    [arrivals, departures, stopRoutes.data],
  );
  const boardView = useCallback(
    () => ({
      tab,
      date,
      time,
      range,
      showConnections,
      timetableRoutes: tab === 'timetable' ? selected : timetableRoutes.current,
      departureRoutes: tab === 'timetable' ? departureRoutes.current : selected,
    }),
    [tab, date, time, range, selected, showConnections],
  );
  useEffect(() => {
    if (!id || useMapStore.getState().selectedStopId !== id) return;
    rememberStopBoardView(id, boardView());
  }, [id, boardView]);
  const select = (dep: Departure) => {
    const tripId = dep.trip?.gtfsId || dep.trip?.id;
    if (!tripId) return;
    if (id) rememberStopBoardView(id, boardView());
    useMapStore.getState().setSelectedVehicle({
      tripId,
      vehicleId: dep.vehicle?.vehicleId ?? undefined,
      frontDoor: dep.frontDoor,
      serviceDay: dep.serviceDay != null ? serviceDate(dep.serviceDay * 1000) : undefined,
    });
  };
  const changeTab = (next: typeof tab) => {
    if (activeTab === 'timetable') timetableRoutes.current = selected;
    else departureRoutes.current = selected;
    useMapStore
      .getState()
      .setStopRouteFilter(next === 'timetable' ? timetableRoutes.current : departureRoutes.current);
    setTab(next);
  };
  const changeDay = (amount: number) => {
    setArrivalCutoff(undefined);
    const next = serviceDayBounds(now, offset + amount).date;
    setDate(next);
    setRange(0);
    if (activeTab !== 'timetable') {
      departureRoutes.current = null;
      useMapStore.getState().setStopRouteFilter(null);
    }
  };
  const clock = formatServiceTime(now);
  const dateLabel = today
    ? t('today')
    : new Intl.DateTimeFormat(language === 'hu' ? 'hu-HU' : 'en-GB', {
        timeZone: TRANSIT_TIME_ZONE,
        month: 'short',
        day: 'numeric',
      }).format(day.start * 1000);
  const fullTimetable = () => {
    setArrivalCutoff(undefined);
    setTime(null);
    setRange(0);
    setDate(null);
    changeTab('departures');
    departureRoutes.current = null;
    useMapStore.getState().setStopRouteFilter(null);
    setShowFullTimetable(false);
  };
  return {
    fullTimetable,
    showFullTimetable,
    backToVehicle: initial.vehicle ? () => useMapStore.getState().setSelectedVehicle(initial.vehicle!) : undefined,
    id,
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
    changeTime: (value: string) => {
      setArrivalCutoff(undefined);
      setDate(day.date);
      setTime(value);
      setRange(0);
      if (activeTab === 'timetable') changeTab('departures');
    },
    resetTime: () => {
      setArrivalCutoff(undefined);
      setDate(null);
      setTime(null);
      setRange(0);
    },
  };
}
