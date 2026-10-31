import { selectedRoutePattern } from '@/lib/transit/route-pattern';
import { useCameraPosition } from '@/hooks/useCameraPosition';
import { useLiveTrip } from '@/hooks/useLiveTrip';
import { intermediateTimes, intermediateEpoch } from '~/features/planner/model/intermediate-times';
import { journeyStopFeatures } from './model/stop-features';
import { getMapRouteColor } from '~/lib/transit/colors';
import { useJourneyPlan } from '~/hooks/useJourneyPlan';
import { usePlannerStore } from '~/store/usePlannerStore';
import { journeyMap } from '~/features/planner/model/map';
import { journeyTime, sortJourneys } from '~/features/planner/model/journey';
import { useRouteDetail } from '@/hooks/useRouteDetail';
import { useRouteTimetable } from '@/hooks/useRouteTimetable';
import { useStopConnections } from '@/hooks/useStopConnections';
import { useStopDetail } from '@/hooks/useStopDetail';
import { useStopRoutes } from '@/hooks/useStopRoutes';
import { useStopsInBounds } from '@/hooks/useStopsInBounds';
import { useTranslation } from '@/hooks/useTranslation';
import { useTripDetail } from '@/hooks/useTripDetail';
import { useVehicleMotion } from '@/hooks/useVehicleMotion';
import { useVehiclesInBounds } from '@/hooks/useVehiclesInBounds';
import { newestVehiclePosition, vehiclePositionKey } from '@/lib/vehicle-position';
import { formatDuration } from '@/lib/transit/time/format';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import { useMemo } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { selectMapFeature } from '~/features/map/actions/select-feature';
import { featureBounds } from '~/features/map/model/geojson';
import { vehicleFeatures, vehicleSymbolFeatures } from '~/features/map/model/vehicle-features';
import { visibleVehicleFrames } from '~/features/map/model/vehicle-frames';
import { mapPaths } from './map-paths';
import { mapStops } from './map-stops';
import { selectedMapVehicles } from './model/selected-vehicles';

export function useMapData() {
  const planning = usePlannerStore((state) => state.open);
  const from = usePlannerStore((state) => state.from);
  const to = usePlannerStore((state) => state.to);
  const selectedJourneyId = usePlannerStore((state) => state.selectedId);
  const sort = usePlannerStore((state) => state.sort);
  const focusedLeg = usePlannerStore((state) => state.focusedLeg);
  const expandedLegs = usePlannerStore((state) => state.expandedLegs);
  const mapRevision = usePlannerStore((state) => state.mapRevision);
  const plan = useJourneyPlan();
  const journeys = useMemo(() => sortJourneys(plan.data?.journeys ?? [], sort), [plan.data, sort]);
  const journey = journeys.find((item) => item.id === selectedJourneyId) ?? journeys[0];
  const expandedLeg =
    planning && focusedLeg != null && expandedLegs.includes(focusedLeg)
      ? journey?.legs[focusedLeg]
      : undefined;
  const expandedTrip = useTripDetail(expandedLeg?.tripId ?? null, expandedLeg?.serviceDate);
  const selection = useMapStore((s) => s.selectedVehicle);
  const stopId = useMapStore((s) => s.selectedStopId);
  const previousStopId = useMapStore((s) => s.previousStopId);
  const routeId = useMapStore((s) => s.selectedRouteId);
  const patternId = useMapStore((s) => s.selectedPatternId);
  const selectedRoutes = useMapStore((s) => s.stopRouteFilter);
  const showConnections = useMapStore((s) => s.showStopConnections);
  const modes = useMapStore((s) => s.selectedModes);
  const vehicles = useVehiclesInBounds(!planning, !planning);
  const stops = useStopsInBounds(!planning);
  const trip = useLiveTrip(selection?.tripId ?? null, selection?.serviceDay);
  const stopDetail = useStopDetail(stopId, { timeRange: 86400 });
  const route = useRouteDetail(routeId);
  const stopRoutes = useStopRoutes(stopId);
  const connections = useStopConnections(stopId, showConnections);
  const reducedMotion = useReducedMotion();
  const zoom = useMapStore((s) => Math.floor(s.zoom));
  const theme = useUIStore((s) => s.theme);
  const mergedVehicles = useMemo(
    () =>
      selectedMapVehicles({
        routeId,
        route: route.data,
        stopId,
        stopRoutes: stopRoutes.data,
        selectedRoutes,
        vehicles: planning ? [] : vehicles.data,
        trip: trip.data,
        selection,
        modes,
      }),
    [
      planning,
      vehicles.data,
      route.data,
      stopRoutes.data,
      routeId,
      stopId,
      selectedRoutes,
      trip.data,
      modes,
      selection,
    ],
  );
  const animatedVehicles = useVehicleMotion(mergedVehicles, reducedMotion, selection ? trip.data?.decodedPolyline : undefined);
  const pattern =
    selectedRoutePattern(route.data, patternId);
  const timings = useRouteTimetable(routeId, pattern);
  const { t } = useTranslation();
  const paths = useMemo(
    () =>
      mapPaths({
        route: route.data,
        pattern,
        trip: trip.data,
        connections: connections.data,
        stopId,
        selectedRoutes,
        showConnections,
        theme,
      }),
    [
      pattern,
      route.data,
      trip.data,
      showConnections,
      connections.data,
      stopId,
      selectedRoutes,
      theme,
    ],
  );
  const position = useCameraPosition(selection ? newestVehiclePosition(animatedVehicles ?? mergedVehicles) : null);
  // Label metrics, colors and glyph layout change only with feed data or zoom.
  const baseMarkers = useMemo(() => vehicleFeatures(mergedVehicles, selection?.tripId,
    zoom, !!routeId || !!stopId, theme),
    [mergedVehicles, selection?.tripId, zoom, routeId, stopId, theme]);
  const baseSymbols = useMemo(() => vehicleSymbolFeatures(baseMarkers), [baseMarkers]);
  const frames = useMemo(() => new Map(visibleVehicleFrames(mergedVehicles, animatedVehicles)
    .map((v) => [vehiclePositionKey(v), v])), [mergedVehicles, animatedVehicles]);
  const animateFeatures = (collection: typeof baseMarkers): typeof baseMarkers => ({
    ...collection, features: collection.features.map((feature) => {
      const frame = frames.get(feature.properties?.motionKey);
      return frame ? { ...feature, geometry: { ...feature.geometry, coordinates: [frame.lon!, frame.lat!] },
        properties: { ...feature.properties, heading: frame.heading ?? 0 } } : feature;
    }),
  });
  const markers = animateFeatures(baseMarkers);
  const symbols = animateFeatures(baseSymbols);
  const stopMarkers = useMemo(
    () =>
      mapStops({
        stops: stops.data,
        stopDetail: stopDetail.data,
        stopId,
        previousStopId,
        selection,
        trip: trip.data,
        route: route.data,
        routeId,
        pattern,
        timings: timings.data,
        zoom,
        theme,
        terminusLabel: t('route_terminus'),
        elapsedLabel: (minutes) => t('elapsed_duration', { duration: formatDuration(minutes, t) }),
      }),
    [
      stops.data,
      stopDetail.data,
      previousStopId,
      zoom,
      theme,
      selection,
      trip.data,
      routeId,
      pattern,
      route.data,
      timings.data,
      stopId,
      t,
    ],
  );
  const planned = useMemo(
    () => journeyMap(planning ? journey : undefined, theme, planning ? [from, to] : []),
    [planning, journey, theme, from, to],
  );
  const intermediateMarkers = useMemo<import('geojson').Feature<import('geojson').Point>[]>(() => {
    if (!expandedLeg) return [];
    const stops = intermediateTimes(expandedLeg, expandedTrip.data).map(
      ({ stop, timing }, index) => {
        const epoch = intermediateEpoch(timing);
        return {
          ...stop,
          id: `intermediate-${index}`,
          time: epoch != null ? journeyTime(epoch) : undefined,
        };
      },
    );
    return journeyStopFeatures(
      stops,
      getMapRouteColor(expandedLeg.mode, expandedLeg.routeColor, theme),
      theme,
      [],
    ).features.map((feature) => ({
      ...feature,
      properties: { ...feature.properties, kind: 'journey', terminal: false, legIndex: focusedLeg },
    }));
  }, [expandedLeg, expandedTrip.data, theme, focusedLeg]);
  const legBounds =
    focusedLeg != null
      ? featureBounds({
          type: 'FeatureCollection',
          features: planned.paths.features.filter(
            (feature) => feature.properties?.legIndex === focusedLeg,
          ),
        })
      : undefined;
  return {
    vehicles,
    stops,
    connections,
    paths: planning ? planned.paths : paths,
    markers: planning ? { ...markers, features: [] } : markers,
    symbols: planning ? { ...symbols, features: [] } : symbols,
    stopMarkers: planning
      ? { ...planned.stops, features: [...planned.stops.features, ...intermediateMarkers] }
      : stopMarkers,
    position: planning ? null : position,
    selectFeature: planning
      ? (feature: import('geojson').Feature) => {
          if (typeof feature.properties?.legIndex === 'number')
            usePlannerStore.getState().focusLeg(feature.properties.legIndex);
        }
      : selectMapFeature,
    fitBounds: planning ? legBounds || planned.bounds : featureBounds(paths),
    fitKey: planning
      ? `journey-${journey?.id || `${from?.name}-${to?.name}`}-${focusedLeg}-${mapRevision}`
      : selection
        ? `trip-${selection.tripId}-${selection.serviceDay}`
        : routeId
          ? `route-${routeId}-${pattern?.id}`
          : null,
  };
}
export type MapData = ReturnType<typeof useMapData>;
