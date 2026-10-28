import type { routeTimings } from '@/lib/route-timings';
import type { DecodedTripDetail } from '@/lib/transit/client';
import { getMapRouteColor, getRouteColor } from '@/lib/transit/colors';
import { formatTimeOfDay } from '@/lib/transit/time/format';
import { stopTiming } from '@/lib/transit/stop-times';
import type { RouteDetail, RoutePattern } from '@/lib/transit/types/route';
import type { GroupedChildStop, StopDetail } from '@/lib/transit/types/stop';
import type { SelectedVehicle } from '@/store/useMapStore';
import type { FeatureCollection, Point } from 'geojson';
import { focusedMapStops } from '~/features/map/model/focused-stops';
import { journeyStopFeatures, stopFeatures } from '~/features/map/model/stop-features';

interface MapStopInput {
  stops: GroupedChildStop[] | undefined;
  stopDetail: StopDetail | null | undefined;
  stopId: string | null;
  previousStopId: string | null;
  selection: SelectedVehicle | null;
  trip: DecodedTripDetail | null | undefined;
  route: RouteDetail | null | undefined;
  routeId: string | null;
  pattern: RoutePattern | undefined;
  timings: ReturnType<typeof routeTimings> | null | undefined;
  zoom: number;
  theme: 'dark' | 'light';
  elapsedLabel: (minutes: number) => string;
}
const emptyStops: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };

export function mapStops({
  stops,
  stopDetail,
  stopId,
  previousStopId,
  selection,
  trip,
  route,
  routeId,
  pattern,
  timings,
  zoom,
  theme,
  elapsedLabel,
}: MapStopInput): FeatureCollection<Point> {
  const selected = [stopId, previousStopId].filter((id): id is string => !!id);
  const ordinaryStops = focusedMapStops(stops, stopDetail, stopId, !!selection || !!routeId, zoom);
  const ordinary = stopFeatures(ordinaryStops, selected, zoom, theme);
  let journey = emptyStops;
  if (trip && selection) {
    const entries = trip.stoptimes?.length
      ? trip.stoptimes.map((time, index, all) => ({
          ...time.stop,
          time: formatTimeOfDay(
            stopTiming(time, index === all.length - 1 ? 'arrivals' : 'departures').seconds,
          ),
        }))
      : (trip.pattern?.stops ?? []);
    journey = journeyStopFeatures(
      entries,
      getMapRouteColor(
        trip.route?.mode ?? undefined,
        getRouteColor(trip.route?.mode, trip.route?.color, trip.route?.textColor).primary,
        theme,
      ),
      theme,
      selected,
    );
  } else if (routeId && pattern) {
    journey = journeyStopFeatures(
      (pattern.stops ?? []).map((stop, index) => ({
        ...stop,
        time:
          timings?.rows[index]?.elapsedMinutes != null
            ? elapsedLabel(timings.rows[index].elapsedMinutes!)
            : '',
      })),
      getMapRouteColor(
        route?.mode ?? undefined,
        getRouteColor(route?.mode, route?.color, route?.textColor).primary,
        theme,
      ),
      theme,
      selected,
    );
  }
  const ids = new Set(journey.features.map((feature) => feature.properties?.stopId));
  return {
    ...ordinary,
    features: [
      ...ordinary.features.filter((feature) => !ids.has(feature.properties?.stopId)),
      ...journey.features,
    ],
  };
}
