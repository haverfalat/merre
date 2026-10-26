import type { VehiclePosition } from '@/lib/transit/types/vehicle';
import { useMemo } from 'react';
import { useNow } from '@/hooks/useNow';
import { useTripDetail } from '@/hooks/useTripDetail';
import { useVehiclesInBounds } from '@/hooks/useVehiclesInBounds';
import { timelineProgress } from '@/lib/timeline-progress';
import { getRouteColor } from '@/lib/transit/colors';
import { tripVehiclePositions } from '@/lib/transit/trip-vehicles';
import { newestVehiclePosition } from '@/lib/vehicle-position';
import { useMapStore } from '@/store/useMapStore';

import { tripTimelineItems } from '~/features/trips/model/trip-timeline';
import { tripFrontDoorBoarding } from '~/lib/boarding-policy';

export function useTripPanel() {
  const selection = useMapStore((s) => s.selectedVehicle);
  const previous = useMapStore((s) => s.previousStopId);
  const camera = useMapStore((s) => s.vehicleCameraMode);
  const query = useTripDetail(selection?.tripId ?? null, selection?.serviceDay, true);
  const vehicles = useVehiclesInBounds();
  const now = useNow();
  const trip = query.data;
  const position = useMemo(() => {
    const matches = (v: VehiclePosition) =>
      ((v.trip?.gtfsId || v.trip?.id) === selection?.tripId ||
        (!!selection?.vehicleId && v.vehicleId === selection.vehicleId)) &&
      (!selection?.serviceDay ||
        !v.trip?.serviceDate ||
        selection.serviceDay.replaceAll('-', '') === v.trip.serviceDate.replaceAll('-', ''));
    return (
      newestVehiclePosition([
        ...(vehicles.data?.filter(matches) ?? []),
        ...tripVehiclePositions(trip, selection?.serviceDay).filter(matches),
      ]) ?? newestVehiclePosition(trip?.vehiclePositions ?? [])
    );
  }, [vehicles.data, trip, selection]);
  const route = trip?.route;
  const routeId = route?.gtfsId || route?.id;
  const color = getRouteColor(route?.mode, route?.color, route?.textColor).primary;
  const progress = timelineProgress(trip?.stoptimes ?? [], position, now);
  const items = tripTimelineItems(trip);
  const frontDoor = tripFrontDoorBoarding(
    trip,
    !!selection?.frontDoor,
    position?.trip?.tripHeadsign,
  );
  return {
    selection,
    previous,
    camera,
    query,
    trip,
    position,
    route,
    routeId,
    color,
    progress,
    items,
    frontDoor,
  };
}
