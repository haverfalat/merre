import { useLiveTrip } from '@/hooks/useLiveTrip';
import type { TripDetail } from '~/lib/transit/types/trip';
import { useMemo } from 'react';
import { useNow } from '@/hooks/useNow';
import { useVehiclesInBounds } from '@/hooks/useVehiclesInBounds';
import { timelineProgress } from '@/lib/timeline-progress';
import { getRouteColor } from '@/lib/transit/colors';
import { tripVehiclePositions } from '@/lib/transit/trip-vehicles';
import { matchesSelectedVehicle, newestVehiclePosition } from '@/lib/vehicle-position';
import { useMapStore } from '@/store/useMapStore';

import { tripTimelineItems } from '~/features/trips/model/trip-timeline';
import { tripFrontDoorBoarding } from '~/lib/boarding-policy';

export function useTripPanel() {
  const selection = useMapStore((s) => s.selectedVehicle);
  const previous = useMapStore((s) => s.previousStopId);
  const camera = useMapStore((s) => s.vehicleCameraMode);
  const query = useLiveTrip(selection?.tripId ?? null, selection?.serviceDay);
  const vehicles = useVehiclesInBounds();
  const now = useNow();
  const trip = query.data;
  const position = useMemo(() => {
    if (!selection) return null;
    return newestVehiclePosition([
      ...(vehicles.data ?? []),
      ...tripVehiclePositions(trip, selection.serviceDay),
    ].filter((vehicle) => matchesSelectedVehicle(vehicle, selection)));
  }, [vehicles.data, trip, selection]);
  const route: TripDetail['route'] = trip?.route ?? (position?.trip?.route
    ? { ...position.trip.route, id: position.trip.route.id ?? null } : null);
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
