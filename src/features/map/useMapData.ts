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
import { newestVehiclePosition } from '@/lib/vehicle-position';
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
  const selection = useMapStore((s) => s.selectedVehicle);
  const stopId = useMapStore((s) => s.selectedStopId);
  const stopIds = useMapStore((s) => s.selectedStopIds);
  const previousStopIds = useMapStore((s) => s.previousStopIds);
  const routeId = useMapStore((s) => s.selectedRouteId);
  const patternId = useMapStore((s) => s.selectedPatternId);
  const selectedRoutes = useMapStore((s) => s.stopRouteFilter);
  const showConnections = useMapStore((s) => s.showStopConnections);
  const modes = useMapStore((s) => s.selectedModes);
  const vehicles = useVehiclesInBounds(true);
  const stops = useStopsInBounds();
  const trip = useTripDetail(selection?.tripId ?? null, selection?.serviceDay, true);
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
        stopIds,
        stopRoutes: stopRoutes.data,
        selectedRoutes,
        vehicles: vehicles.data,
        trip: trip.data,
        selection,
        modes,
      }),
    [
      vehicles.data,
      route.data,
      stopRoutes.data,
      routeId,
      stopId,
      stopIds,
      selectedRoutes,
      trip.data,
      modes,
      selection,
    ],
  );
  const animatedVehicles = useVehicleMotion(mergedVehicles, reducedMotion);
  const pattern =
    route.data?.patterns?.find((p) => p.id === patternId) ?? route.data?.patterns?.[0];
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
        stopIds,
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
      stopIds,
      selectedRoutes,
      theme,
    ],
  );
  const position = selection ? newestVehiclePosition(mergedVehicles) : null;
  const markers = useMemo(
    () =>
      vehicleFeatures(
        visibleVehicleFrames(mergedVehicles, animatedVehicles),
        selection?.tripId,
        zoom,
        !!routeId || !!stopId,
        theme,
      ),
    [animatedVehicles, mergedVehicles, selection?.tripId, zoom, routeId, stopId, theme],
  );
  const symbols = useMemo(() => vehicleSymbolFeatures(markers), [markers]);
  const stopMarkers = useMemo(
    () =>
      mapStops({
        stops: stops.data,
        stopDetail: stopDetail.data,
        stopId,
        stopIds,
        previousStopIds,
        selection,
        trip: trip.data,
        route: route.data,
        routeId,
        pattern,
        timings: timings.data,
        zoom,
        theme,
        elapsedLabel: (minutes) => t('elapsed_duration', { duration: formatDuration(minutes, t) }),
      }),
    [
      stops.data,
      stopDetail.data,
      stopIds,
      previousStopIds,
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
  return {
    vehicles,
    stops,
    connections,
    paths,
    markers,
    symbols,
    stopMarkers,
    position,
    selectFeature: selectMapFeature,
    fitBounds: featureBounds(paths),
    fitKey: selection
      ? `trip-${selection.tripId}-${selection.serviceDay}`
      : routeId
        ? `route-${routeId}-${pattern?.id}`
        : null,
  };
}
export type MapData = ReturnType<typeof useMapData>;
