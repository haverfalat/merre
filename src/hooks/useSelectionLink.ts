import { useMapStore } from '@/store/useMapStore';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

export function useSelectionLink() {
  const params = useLocalSearchParams<{
    stop?: string;
    trip?: string;
    route?: string;
    day?: string;
  }>();
  useEffect(() => {
    const state = useMapStore.getState();
    if (typeof params.trip === 'string' && params.trip) {
      if (
        state.selectedVehicle?.tripId !== params.trip ||
        state.selectedVehicle.serviceDay !== params.day
      )
        state.setSelectedVehicle({
          tripId: params.trip,
          serviceDay: typeof params.day === 'string' ? params.day : undefined,
        });
    } else if (typeof params.stop === 'string' && params.stop) {
      if (state.selectedStopId !== params.stop) state.setSelectedStopId(params.stop);
    } else if (typeof params.route === 'string' && params.route) {
      if (state.selectedRouteId !== params.route) state.setSelectedRouteId(params.route);
    } else if (state.selectedVehicle || state.selectedStopId || state.selectedRouteId)
      state.clearSelection();
  }, [params.stop, params.trip, params.route, params.day]);
  useEffect(
    () =>
      useMapStore.subscribe((state, previous) => {
        if (
          state.selectedStopId === previous.selectedStopId &&
          state.selectedRouteId === previous.selectedRouteId &&
          state.selectedVehicle?.tripId === previous.selectedVehicle?.tripId &&
          state.selectedVehicle?.serviceDay === previous.selectedVehicle?.serviceDay
        )
          return;
        router.setParams({
          stop: state.selectedStopId || undefined,
          route: state.selectedRouteId || undefined,
          trip: state.selectedVehicle?.tripId || undefined,
          day: state.selectedVehicle?.serviceDay || undefined,
        });
      }),
    [],
  );
}
