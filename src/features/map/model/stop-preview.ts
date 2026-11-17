import { isRailMode } from '@/lib/transit/modes';
import { cleanTransitPlaceName } from '@/lib/transit/labels';
import type { StopDetail, StopRoutesResponse } from '@/lib/transit/types/stop';
import { hasRailBoard, stopBoardRows } from '~/features/stops/model/station-board-model';
import { stopRouteOptions } from '~/features/stops/model/stop-route-filters';
import { departurePresentation } from '~/features/stops/model/departure-presentation';

type PreviewTime = Pick<ReturnType<typeof departurePresentation>, 'epoch' | 'minutes' | 'time' | 'tone' | 'live'>;
interface PreviewRoute {
  id: string;
  routeId: string;
  label: string;
  mode?: string | null;
  color?: string | null;
  headsign: string;
  frontDoor: boolean;
  direction: 'incoming' | 'outgoing';
  times: PreviewTime[];
}

export function stopPreviewContent(
  stop: StopDetail | null | undefined,
  stopRoutes: StopRoutesResponse | null | undefined,
  unknownOrigin = '',
  now = Date.now(),
) {
  const rail = hasRailBoard(stop) || !!stopRoutes?.routes.some((route) => isRailMode(route.mode));
  const departures = stopBoardRows(stop, rail ? 'departures' : 'combined', unknownOrigin);
  const directions = stop?.boardingDirections ?? stopRoutes?.boardingDirections;
  const options = stopRouteOptions(departures, stopRoutes?.routes);
  const destinations = new Map<string, PreviewRoute>();
  const validHeadsign = (value: string | null | undefined) => {
    const name = cleanTransitPlaceName(value).trim();
    return name && name !== cleanTransitPlaceName(unknownOrigin).trim() ? name : '';
  };
  for (const departure of departures) {
    const headsign = validHeadsign(departure.headsign);
    if (!headsign) continue;
    const timing = departurePresentation(departure, now);
    if (timing.canceled || timing.epoch == null || timing.epoch < now / 1000) continue;
    const direction = departure.boardDirection === 'arrivals' ? 'incoming' : 'outgoing';
    const key = `${departure.routeId}|${direction}|${headsign}`;
    let row = destinations.get(key);
    if (!row) {
      row = { id: key, routeId: departure.routeId, label: departure.routeLabel,
        mode: departure.mode, color: departure.color, headsign, direction,
        frontDoor: false, times: [] };
      destinations.set(key, row);
    }
    row.frontDoor ||= !!departure.frontDoor;
    row.times.push(timing);
  }
  // Static route information is useful outside service hours, but must have a destination.
  const served = new Set([...destinations.values()].map(row => row.routeId));
  for (const option of options) if (!served.has(option.id)) {
    const boarding = directions?.filter(direction => direction.routeId === option.id);
    const fallbacks = boarding?.length ? boarding.map(direction => ({
      headsign: direction.event === 'arrivals' ? direction.origin : direction.headsign,
      direction: direction.event === 'arrivals' ? 'incoming' as const : 'outgoing' as const,
    })) : [{ headsign: option.headsign, direction: 'outgoing' as const }];
    for (const fallback of fallbacks) {
      const headsign = validHeadsign(fallback.headsign);
      if (!headsign) continue;
      const id = `${option.id}|${fallback.direction}|${headsign}`;
      destinations.set(id, { ...option, id, routeId: option.id, headsign,
        direction: fallback.direction, times: [] });
    }
  }
  const routes = [...destinations.values()];
  for (const route of routes) route.times = route.times
    .sort((a, b) => a.epoch! - b.epoch!).slice(0, 3);
  routes.sort((a, b) => {
    const first = a.times[0]?.epoch ?? Infinity;
    const second = b.times[0]?.epoch ?? Infinity;
    if (first !== second) return first < second ? -1 : 1;
    return a.label.localeCompare(b.label, undefined, { numeric: true }) ||
      a.headsign.localeCompare(b.headsign) || a.id.localeCompare(b.id);
  });
  return { routes, rail };
}
